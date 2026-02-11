# Instructions pour obtenir le Stack Trace complet

## Étape 1: Relancer l'app proprement
```bash
cd /Users/lakhdari/Desktop/AppFoot/mobile

# Tuer tous les processus
pkill -f "expo\|metro\|react-native" 2>/dev/null

# Supprimer caches
rm -rf node_modules/.cache .expo

# Relancer
npx expo start --clear
```

## Étape 2: Dans un NOUVEAU terminal, lancer iOS
```bash
cd /Users/lakhdari/Desktop/AppFoot/mobile
npx expo run:ios 2>&1 | tee full-error-log.txt
```

## Étape 3: Quand l'erreur apparaît
Dans le terminal, copiez TOUT depuis "ERROR" jusqu'à la fin du stack trace (toutes les lignes qui commencent par "at ...")

Ou envoyez le fichier `full-error-log.txt` qui contient tout.

## Stack trace attendu (exemple):
```
ERROR  [runtime not ready]: TypeError: Cannot read property 'sm' of undefined
    at Object.<anonymous> (/path/to/file.tsx:123:45)
    at Module._compile (internal/modules/cjs/loader.js:1137:30)
    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1157:10)
    at Module.load (internal/modules/cjs/loader.js:985:32)
    ...
```

C'est la partie "at /path/to/file.tsx:123:45" qui m'indiquera le fichier EXACT!
