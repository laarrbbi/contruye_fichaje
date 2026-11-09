# Construye Fichaje

Dos plataformas **separadas** para la construcción en España, con el diseño de
[CONSTRUYE](https://github.com/laarrbbi/contruye):

| Plataforma | Para quién | Quién paga |
|---|---|---|
| **Construye Empleo** (`/empleo`) | Trabajadores de obra (oficiales, peones, instaladores, técnicos) y las empresas que los contratan | Las empresas, para hablar con los candidatos. Los trabajadores, nunca |
| **Construye Obras** (`/obras`) | Particulares que quieren una obra o una reforma, y las empresas que la hacen | Las empresas, para desbloquear solicitudes. Los particulares, nunca |

Empleo y Obras no se mezclan: cada cuenta es de un solo tipo (`worker`, `employer`, `client` o
`provider`), las rutas de la API y las pantallas de cada plataforma están cerradas a las demás
cuentas, y el logotipo dice en cuál estás (CONSTRUYE **EMPLEO** / **OBRAS**).

## El modelo de negocio (como JobToday)

**Empleo**

1. La empresa publica una oferta **gratis** (30 días en el buscador).
2. Los trabajadores se inscriben **con un toque**: su perfil es el currículum.
3. La empresa ve a cada candidato **resumido**: nombre e inicial, oficio, años, TPC, PRL, carné,
   zona, disponibilidad. Su teléfono, su e-mail y cualquier contacto escrito en su presentación o
   en su mensaje están **ocultos** (`App\Support\Redact`).
4. Para **chatear** con los candidatos y ver su contacto, la empresa **activa la oferta**:

| Producto | Qué da | Precio por defecto |
|---|---|---|
| Básica | Publicar y recibir candidaturas | Gratis |
| Oferta Activa | Chat y contacto con todos los candidatos de la oferta, 30 días | 39 € |
| Oferta Premium | Lo de Activa + destacada arriba del buscador, 30 días | 69 € |
| Plan Empresa | Todas las ofertas desbloqueadas 30 días + 25 contactos | 149 € |
| Pack de contactos | 10 trabajadores del directorio | 49 € |

Con los **contactos**, la empresa escribe a trabajadores del **directorio** (los que han elegido
aparecer) aunque no se hayan inscrito en su oferta. Solo la empresa abre un chat; el trabajador
contesta.

**Obras**

1. El particular describe su obra **gratis** (tipo, provincia, presupuesto, plazo).
2. Las empresas de ese oficio y esa provincia la leen **sin el contacto** del cliente.
3. Una empresa que la quiere la **desbloquea con créditos** (1 a 4 según el presupuesto) y tiene
   teléfono, e-mail y chat. Cada solicitud la desbloquean **4 empresas como máximo**
   (`OBRAS_MAX_UNLOCKS`): el cliente recibe unos pocos presupuestos, no una avalancha de llamadas.
4. Packs de créditos: 5 (35 €), 15 (89 €), 40 (199 €).

Todos los precios llevan el **IVA incluido** y son **valores de partida para que el propietario
los fije**: están en `api/config/catalog.php` y se cambian con variables de entorno
(`PRICE_OFFER_ACTIVE=3900`, en céntimos). Ningún otro sitio del código escribe un precio. Cada pago
es único: nada se renueva solo.

## Arquitectura

Monorepo, el mismo stack que CONSTRUYE:

| Carpeta | Papel | Stack |
|---|---|---|
| `api/` | API REST | Laravel 12 · PHP 8.3 · MySQL 8 (SQLite en los tests) · Sanctum (cookies SPA) · Stripe · Pest |
| `web/` | SPA | React 18 · Vite · TypeScript · Tailwind · UI estilo shadcn · TanStack Query · i18next (es, en) |
| `docker/` | Imágenes de desarrollo | php-fpm 8.3, nginx |

El diseño es el de CONSTRUYE: los mismos tokens (`web/tailwind.config.js`, `web/src/index.css`),
la noche y el papel, Poppins, el botón ámbar `btn-or`, el cristal `verre` de las pantallas de
cuenta, el vídeo de obra y los componentes de la UI. Las imágenes son las mismas, con licencia
libre: ver [`docs/credits-photos.md`](docs/credits-photos.md).

### Lo que cruza el muro de pago

Todo se decide en `api/app/Support/Present.php` y `api/app/Support/EmpleoAccess.php`:

- Un trabajador está **desbloqueado** para una empresa si ya tienen un chat, si la empresa lo
  contactó desde el directorio con un crédito, o si se inscribió en una oferta de la empresa que
  está activada (pagada, o bajo el Plan Empresa).
- Una solicitud de obra está desbloqueada para la empresa que gastó sus créditos en ella.
- Bloqueado, nunca salen el nombre completo, el teléfono, el e-mail ni el código postal; el texto
  libre pasa por `Redact::contacts()`.

### Pagos

| Situación | Flujo |
|---|---|
| **Stripe configurado** (`STRIPE_SECRET` y `STRIPE_WEBHOOK_SECRET`) | Stripe Checkout alojado → webhook `checkout.session.completed` (firma, importe y moneda comprobados) → `OrderFulfillment::markPaid()` |
| **Demo local** (`PAYMENTS_SIMULATE=true`, sin Stripe) | Una pantalla de «pago de demostración» con un botón. **Se rechaza siempre en producción** |
| Ninguno | El checkout responde 503 y la web lo dice |

`markPaid()` bloquea la fila del pedido: un pedido se entrega una sola vez aunque el webhook llegue
dos veces. Los créditos tienen un libro (`credit_movements`) que nunca se edita.

## Arranque local

Con Docker (como CONSTRUYE):

```bash
make setup     # .env, contenedores, composer install, clave, base de datos con la demo, npm install
make up        # API en http://localhost:8000
make web       # SPA en http://localhost:5174
make test      # suite Pest
```

Sin Docker (PHP 8.3 y Node 20+):

```bash
cd api && cp .env.example .env
# en api/.env: DB_CONNECTION=sqlite y SESSION_DOMAIN=null
touch database/database.sqlite
composer install && php artisan key:generate && php artisan migrate --seed
php artisan serve --port=8000
```

```bash
npm --prefix web install && npm --prefix web run dev
```

Abre **http://localhost:5174** (no `127.0.0.1`: la cookie de sesión es de `localhost`).

### Cuentas de demostración (solo desarrollo, contraseña `password`)

| E-mail | Cuenta | Qué enseña |
|---|---|---|
| `empresa@example.es` | Empresa que contrata | Una oferta activada con chat, una oferta gratis con candidatos bloqueados, 3 contactos |
| `trabajador@example.es` | Trabajador | Candidaturas y un chat abierto con la empresa |
| `cliente@example.es` | Particular | Dos solicitudes de obra |
| `reformas@example.es` | Empresa de obras | 6 créditos, solicitudes de Madrid |
| `admin@example.es` | Administración | Cifras, cuentas, pagos, ofertas, solicitudes |

La demo se niega a ejecutarse en producción. Una base real recibe su administrador con
`php artisan app:create-admin tu@correo.es`.

## Variables de entorno (`api/.env`)

| Variable | Papel |
|---|---|
| `FRONTEND_URL` | Origen de la SPA (CORS, enlaces de los e-mails, vuelta de Stripe) |
| `SANCTUM_STATEFUL_DOMAINS`, `SESSION_DOMAIN` | Autenticación por cookie de la SPA |
| `STRIPE_SECRET`, `STRIPE_WEBHOOK_SECRET` | Stripe Checkout (tarjeta, EUR). Webhook: `https://tu-dominio/api/webhooks/stripe` |
| `PAYMENTS_SIMULATE` | Pago de demostración en local. Ignorado en producción |
| `PRICE_*` | Precios en céntimos, IVA incluido (`config/catalog.php`) |
| `OBRAS_MAX_UNLOCKS` | Empresas que pueden desbloquear una misma solicitud (4) |
| `MAIL_*` | E-mails en cola: nueva candidatura (a la empresa), chat abierto (al trabajador o al cliente) |

## Lo que queda para el propietario

- Fijar los precios definitivos (`config/catalog.php` o `PRICE_*`).
- Conectar Stripe (clave y secreto del webhook) y el correo saliente.
- Facturas con numeración legal (VeriFactu): no están hechas; los pedidos ya guardan base e IVA.
- Textos legales (aviso legal, privacidad, condiciones) y los datos de la empresa en el pie.
- Moderación: el panel `/admin` cierra ofertas y solicitudes y bloquea cuentas; no hay todavía
  denuncias por parte de los usuarios.
