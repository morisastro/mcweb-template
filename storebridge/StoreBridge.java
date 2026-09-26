package pl.mcweb.storebridge;

import org.bukkit.Bukkit;
import org.bukkit.command.CommandSender;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.scheduler.BukkitRunnable;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

/**
 * StoreBridge — referencyjny plugin Paper realizujący dostawy ze strony.
 *
 * Kompilacja: paper-api 1.20+, gson.
 * Wszystkie komendy są wykonywane z konsoli. Nick gracza walidowany regexem
 * przed podstawieniem, aby zapobiec wstrzykiwaniu komend.
 */
public final class StoreBridge extends JavaPlugin {

    private static final Pattern NICK = Pattern.compile("^[A-Za-z0-9_]{3,16}$");
    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10)).build();
    private final Gson gson = new Gson();

    private String backendUrl;
    private String secret;
    private String modeId;
    private long pollInterval;

    @Override
    public void onEnable() {
        saveDefaultConfig();
        backendUrl = getConfig().getString("backend-url", "").replaceAll("/$", "");
        secret = getConfig().getString("secret", "");
        modeId = getConfig().getString("mode-id", "");
        pollInterval = getConfig().getLong("poll-interval-seconds", 5);

        if (backendUrl.isEmpty() || secret.isEmpty()) {
            getLogger().severe("StoreBridge: brak backend-url lub secret w config.yml — wyłączam.");
            getServer().getPluginManager().disablePlugin(this);
            return;
        }

        new BukkitRunnable() {
            @Override public void run() { poll(); }
        }.runTaskTimerAsynchronously(this, 20L * 5, 20L * pollInterval);

        getLogger().info("StoreBridge uruchomiony (backend=" + backendUrl + ", mode=" + modeId + ")");
    }

    private void poll() {
        try {
            String url = backendUrl + "/api/storebridge/jobs?limit=10"
                    + (modeId.isEmpty() ? "" : "&modeId=" + modeId);
            HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                    .header("x-storebridge-secret", secret)
                    .timeout(Duration.ofSeconds(10))
                    .GET().build();
            HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() != 200) {
                getLogger().warning("StoreBridge fetch failed: " + res.statusCode());
                return;
            }
            JsonObject body = JsonParser.parseString(res.body()).getAsJsonObject();
            JsonArray jobs = body.getAsJsonArray("jobs");
            for (JsonElement e : jobs) {
                JsonObject job = e.getAsJsonObject();
                process(job);
            }
        } catch (Exception ex) {
            getLogger().warning("StoreBridge poll error: " + ex.getMessage());
        }
    }

    private void process(JsonObject job) {
        String publicId = job.get("publicId").getAsString();
        String claimToken = job.get("claimToken").getAsString();
        String player = job.get("playerName").getAsString();
        JsonArray cmds = job.getAsJsonArray("commands");

        // walidacja nicku
        if (!NICK.matcher(player).matches()) {
            report(publicId, claimToken, false, "invalid nick");
            return;
        }

        boolean ok = true;
        String error = null;
        // wykonaj komendy na głównym wątku
        final boolean[] result = { true };
        final String[] err = { null };
        getServer().getScheduler().runTask(this, () -> {
            CommandSender sender = Bukkit.getConsoleSender();
            for (JsonElement c : cmds) {
                String cmd = c.getAsString();
                try {
                    if (!Bukkit.dispatchCommand(sender, cmd)) {
                        // nie-fatalne: wiele komend zwraca false przy sukcesie
                    }
                } catch (Exception ex) {
                    result[0] = false;
                    err[0] = ex.getMessage();
                }
            }
        });

        try { Thread.sleep(100); } catch (InterruptedException ignored) {}
        report(publicId, claimToken, result[0], err[0]);
    }

    private void report(String publicId, String claimToken, boolean success, String error) {
        try {
            JsonObject payload = new JsonObject();
            payload.addProperty("publicId", publicId);
            payload.addProperty("claimToken", claimToken);
            payload.addProperty("success", success);
            if (error != null) payload.addProperty("error", error);
            HttpRequest req = HttpRequest.newBuilder(URI.create(backendUrl + "/api/storebridge/report"))
                    .header("x-storebridge-secret", secret)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(gson.toJson(payload)))
                    .timeout(Duration.ofSeconds(10))
                    .build();
            http.send(req, HttpResponse.BodyHandlers.discarding());
        } catch (Exception ex) {
            getLogger().warning("StoreBridge report error: " + ex.getMessage());
        }
    }

    @Override
    public void onDisable() {
        getLogger().info("StoreBridge wyłączony.");
    }
}
