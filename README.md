Para usar el archivo completar en `index.js` el `DOMAIN_MAILGUN` y la 
`PRIVATE_API_KEY` con los del mailgun de DeR.

Posteriormente instalar paquetes haciendo `npm ci` y correr haciendo `node index.js`.

En las últimas líneas de `index.js` figura el filtro por fecha que se usa.

El script va leyendo de a 300 items (que es el máximo) los logs de mailgun filtrando 
por fecha y por mails que hayan fallado.

Posteriormente dumpea todo a un csv.

Los códigos de los errores se interpretan humanamente. Esto se puede ver en la función `dump_items`.

Para usar en modo testeo recomiendo cambiar el filtro por fecha a uno más reciente 
y descomentar los `console.log` de la función `dump_items`.
