# StoreBridge

StoreBridge to plugin Paper, który łączy stronę z serwerem Minecraft i realizuje zakupy.

**Flow:** Website → Delivery Queue → StoreBridge → Minecraft.

Nie wymaga publicznego RCON. Plugin sam pobiera oczekujące dostawy z backendu strony.

## Jak to działa

1. Po opłaconym zakupie strona tworzy `DeliveryJob` (status `WAITING`).
2. Plugin co kilka sekund pyta backend `/api/storebridge/jobs` (z nagłówkiem `x-storebridge-secret`).
3. Backend atomowo oznacza job jako `PROCESSING` i zwraca komendy z podstawionym nickiem.
4. Plugin wykonuje komendy przez `Bukkit.dispatchCommand`.
5. Plugin zgłasza wynik do `/api/storebridge/report` z `claimToken` (idempotencja — podwójne wykonanie jest zablokowane).
6. Jeśli serwer był offline w momencie zakupu, job czeka w kolejce i zostanie wykonany po starcie.

## Konfiguracja (`plugins/StoreBridge/config.yml`)

```yaml
backend-url: "https://twoja-strona.pl"
secret: "TEN_SAM_CO_W_ENV_STOREBRIDGE_SECRET"
poll-interval-seconds: 5
mode-id: ""        # opcjonalnie: pobieraj tylko joby dla tego trybu
command-sender: "CONSOLE"
```

## Statusy dostawy

- `WAITING` — czeka w kolejce
- `PROCESSING` — plugin pobrał i wykonuje
- `DELIVERED` — wykonano poprawnie
- `FAILED` — błąd (job wraca do `WAITING` i jest ponawiany)

## Przykład komendy produktu

```
lp user {player} parent addtemp vip 30d
```

`{player}` jest walidowany (regex `[A-Za-z0-9_]{3,16}`) zanim zostanie podstawiony — zapobiega to wstrzykiwaniu komend.

## Bezpieczeństwo

- `STOREBRIDGE_SECRET` musi być długim, losowym ciągiem (tylko backend + plugin).
- Sekretu nie udostępniaj publicznie.
- Endpointy są rate-limitowane.

## Instalacja

1. Skopiuj `StoreBridge.jar` do `plugins/`.
2. Ustaw `secret` = wartość `STOREBRIDGE_SECRET` z `.env` strony.
3. Ustaw `backend-url` na adres strony.
4. Zrestartuj serwer.

## Przykładowy skeleton (Java/Paper)

Pełen kod źródłowy referencyjny: `StoreBridge.java`. Skompiluj z `paper-api` i `spigot-api`.
