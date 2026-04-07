require('dotenv').config();
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const rateLimit   = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
const nodemailer  = require('nodemailer');

const app  = express();
const PORT = process.env.PORT || 3000;

/* ─────────────────────────────────────────
   SUPABASE
───────────────────────────────────────── */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY   // service role key (privada, solo backend)
);

/* ─────────────────────────────────────────
   EMAIL — usa Resend si hay RESEND_API_KEY,
   sino intenta SMTP como fallback
───────────────────────────────────────── */
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmail({ to, subject, html }) {
  if (process.env.RESEND_API_KEY) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'CUBO HOUSE <noreply@cubohouse.cl>',
        to,
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Resend error: ${err}`);
    }
    return res.json();
  }
  // fallback SMTP
  return transporter.sendMail({
    from: `"CUBO HOUSE" <${process.env.SMTP_USER}>`,
    to, subject, html,
  });
}

/* ─────────────────────────────────────────
   EMAIL TEMPLATES
───────────────────────────────────────── */
function emailElegido(nombre) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CUBO HOUSE</title></head>
<body style="margin:0;padding:0;background:#0a0a0b;font-family:Arial,Helvetica,sans-serif">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0b;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">

        <!-- HEADER -->
        <tr>
          <td style="background:#0c0c0d;border:1px solid rgba(255,255,255,.06);padding:0">

            <!-- Logo bar -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:28px 40px;border-bottom:1px solid rgba(255,255,255,.06)">
                  <img src="https://cubohouse.cl/Cubo_house_logo/Logo2.png"
                       alt="CUBO HOUSE" height="32" style="display:block;filter:brightness(0) invert(1)">
                </td>
                <td align="right" style="padding:28px 40px;border-bottom:1px solid rgba(255,255,255,.06)">
                  <span style="font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#cc1818;border:1px solid rgba(204,24,24,.5);padding:5px 12px;background:rgba(204,24,24,.08)">
                    ACCESO CONFIRMADO
                  </span>
                </td>
              </tr>
            </table>

            <!-- Red accent bar -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="height:3px;background:linear-gradient(90deg,#cc1818 0%,#8b0000 100%)"></td></tr>
            </table>

            <!-- Hero content -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:48px 40px 0">
                  <p style="margin:0 0 20px;font-size:10px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:#cc1818">
                    17 de Abril &nbsp;&middot;&nbsp; 2026
                  </p>
                  <h1 style="margin:0 0 24px;font-size:36px;font-weight:900;letter-spacing:-1px;line-height:1;color:#ede8df">
                    Fuiste<br>seleccionado.
                  </h1>
                  <p style="margin:0 0 32px;font-size:15px;line-height:1.8;color:#7a7670">
                    Hola <strong style="color:#ede8df;font-weight:600">${nombre}</strong>,<br><br>
                    Tu solicitud fue revisada y elegida para <strong style="color:#ede8df">CUBO HOUSE</strong>.
                    Eres parte de los seleccionados para esta noche exclusiva.
                  </p>
                </td>
              </tr>
            </table>

            <!-- Info box -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:0 40px 40px">
                  <table width="100%" cellpadding="0" cellspacing="0"
                         style="border:1px solid rgba(204,24,24,.4);background:rgba(204,24,24,.07)">
                    <tr>
                      <td style="padding:24px 28px">
                        <p style="margin:0 0 8px;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#cc1818">
                          Proximo paso
                        </p>
                        <p style="margin:0;font-size:14px;line-height:1.75;color:#ede8df">
                          El <strong>17 de Abril a las 12:00</strong> recibiras la ubicacion exacta del evento
                          directamente en este correo y por <strong>WhatsApp</strong>.<br>
                          Guarda este mensaje — es tu comprobante de acceso.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Divider -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="height:1px;background:rgba(255,255,255,.06)"></td></tr>
            </table>

            <!-- Event details row -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="33%" style="padding:24px 40px;border-right:1px solid rgba(255,255,255,.06)">
                  <p style="margin:0 0 4px;font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#3a3a38">Fecha</p>
                  <p style="margin:0;font-size:15px;font-weight:700;color:#cc1818">17 ABR</p>
                </td>
                <td width="33%" style="padding:24px 28px;border-right:1px solid rgba(255,255,255,.06)">
                  <p style="margin:0 0 4px;font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#3a3a38">Horario</p>
                  <p style="margin:0;font-size:15px;font-weight:700;color:#ede8df">19:00 &mdash; 02:00</p>
                </td>
                <td width="33%" style="padding:24px 28px">
                  <p style="margin:0 0 4px;font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#3a3a38">Lugar</p>
                  <p style="margin:0;font-size:15px;font-weight:700;color:#ede8df">Por revelar</p>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="padding:24px 40px;background:#080808;border:1px solid rgba(255,255,255,.04);border-top:none">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="margin:0;font-size:10px;color:#3a3a38;line-height:1.6">
                    Acceso personal e intransferible.<br>
                    No compartas este correo con terceros.
                  </p>
                </td>
                <td align="right">
                  <p style="margin:0;font-size:10px;color:#3a3a38">cubohouse.cl</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
}

function emailUbicacion(nombre, ubicacion) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CUBO HOUSE</title></head>
<body style="margin:0;padding:0;background:#0a0a0b;font-family:Arial,Helvetica,sans-serif">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0b;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">

        <!-- HEADER -->
        <tr>
          <td style="background:#0c0c0d;border:1px solid rgba(255,255,255,.06);padding:0">

            <!-- Logo bar -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:28px 40px;border-bottom:1px solid rgba(255,255,255,.06)">
                  <img src="https://cubohouse.cl/Cubo_house_logo/Logo2.png"
                       alt="CUBO HOUSE" height="32" style="display:block;filter:brightness(0) invert(1)">
                </td>
                <td align="right" style="padding:28px 40px;border-bottom:1px solid rgba(255,255,255,.06)">
                  <span style="font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#cc1818;border:1px solid rgba(204,24,24,.5);padding:5px 12px;background:rgba(204,24,24,.08)">
                    ESTA NOCHE
                  </span>
                </td>
              </tr>
            </table>

            <!-- Red accent bar -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="height:3px;background:linear-gradient(90deg,#cc1818 0%,#8b0000 100%)"></td></tr>
            </table>

            <!-- Hero content -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:48px 40px 0">
                  <p style="margin:0 0 20px;font-size:10px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:#cc1818">
                    17 de Abril &nbsp;&middot;&nbsp; 2026
                  </p>
                  <h1 style="margin:0 0 24px;font-size:36px;font-weight:900;letter-spacing:-1px;line-height:1;color:#ede8df">
                    La<br>ubicacion.
                  </h1>
                  <p style="margin:0 0 32px;font-size:15px;line-height:1.8;color:#7a7670">
                    Hola <strong style="color:#ede8df;font-weight:600">${nombre}</strong>,<br><br>
                    Esta es la ubicacion del evento de esta noche.
                    Presenta este correo en la entrada.
                  </p>
                </td>
              </tr>
            </table>

            <!-- Location box -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:0 40px 40px">
                  <table width="100%" cellpadding="0" cellspacing="0"
                         style="border:1px solid rgba(204,24,24,.5);background:rgba(204,24,24,.09)">
                    <tr>
                      <td style="padding:32px 28px">
                        <p style="margin:0 0 10px;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#cc1818">
                          Direccion
                        </p>
                        <p style="margin:0;font-size:20px;font-weight:700;line-height:1.4;color:#ede8df">
                          ${ubicacion}
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Divider -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="height:1px;background:rgba(255,255,255,.06)"></td></tr>
            </table>

            <!-- Event details row -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="33%" style="padding:24px 40px;border-right:1px solid rgba(255,255,255,.06)">
                  <p style="margin:0 0 4px;font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#3a3a38">Fecha</p>
                  <p style="margin:0;font-size:15px;font-weight:700;color:#cc1818">17 ABR</p>
                </td>
                <td width="33%" style="padding:24px 28px;border-right:1px solid rgba(255,255,255,.06)">
                  <p style="margin:0 0 4px;font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#3a3a38">Puertas abren</p>
                  <p style="margin:0;font-size:15px;font-weight:700;color:#ede8df">19:00 hrs</p>
                </td>
                <td width="33%" style="padding:24px 28px">
                  <p style="margin:0 0 4px;font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#3a3a38">Cierre</p>
                  <p style="margin:0;font-size:15px;font-weight:700;color:#ede8df">02:00 hrs</p>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="padding:24px 40px;background:#080808;border:1px solid rgba(255,255,255,.04);border-top:none">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="margin:0;font-size:10px;color:#3a3a38;line-height:1.6">
                    Acceso personal e intransferible.<br>
                    No compartas esta informacion.
                  </p>
                </td>
                <td align="right">
                  <p style="margin:0;font-size:10px;color:#3a3a38">cubohouse.cl</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
}

function emailConfirmacion(nombre) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CUBO HOUSE</title></head>
<body style="margin:0;padding:0;background:#0a0a0b;font-family:Arial,Helvetica,sans-serif">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0b;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">

        <!-- HEADER -->
        <tr>
          <td style="background:#0c0c0d;border:1px solid rgba(255,255,255,.06);padding:0">

            <!-- Logo bar -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:28px 40px;border-bottom:1px solid rgba(255,255,255,.06)">
                  <img src="https://cubohouse.cl/Cubo_house_logo/Logo2.png"
                       alt="CUBO HOUSE" height="32" style="display:block;filter:brightness(0) invert(1)">
                </td>
                <td align="right" style="padding:28px 40px;border-bottom:1px solid rgba(255,255,255,.06)">
                  <span style="font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#cc1818;border:1px solid rgba(204,24,24,.35);padding:5px 12px">
                    LISTA ABIERTA
                  </span>
                </td>
              </tr>
            </table>

            <!-- Red accent bar -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="height:3px;background:linear-gradient(90deg,#cc1818 0%,#8b0000 100%)"></td></tr>
            </table>

            <!-- Hero content -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:48px 40px 0">
                  <p style="margin:0 0 20px;font-size:10px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:#cc1818">
                    17 de Abril &nbsp;·&nbsp; 2026
                  </p>
                  <h1 style="margin:0 0 24px;font-size:32px;font-weight:900;letter-spacing:-1px;line-height:1;color:#ede8df">
                    Solicitud<br>recibida.
                  </h1>
                  <p style="margin:0 0 32px;font-size:15px;line-height:1.8;color:#7a7670">
                    Hola <strong style="color:#ede8df;font-weight:600">${nombre}</strong>,<br><br>
                    Tu nombre ya forma parte de nuestra lista de espera para <strong style="color:#ede8df">CUBO HOUSE</strong>.
                    Revisamos cada solicitud de forma personal y cuidadosa.
                  </p>
                </td>
              </tr>
            </table>

            <!-- Info box -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:0 40px 40px">
                  <table width="100%" cellpadding="0" cellspacing="0"
                         style="border:1px solid rgba(204,24,24,.25);background:rgba(204,24,24,.04)">
                    <tr>
                      <td style="padding:24px 28px">
                        <p style="margin:0 0 6px;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#cc1818">
                          Que pasa si soy elegido
                        </p>
                        <p style="margin:0;font-size:14px;line-height:1.75;color:#ede8df">
                          Te contactaremos <strong>personalmente por WhatsApp y correo electronico</strong>
                          antes del evento. El dia 17 de Abril a las 12:00 recibiras la ubicacion exacta —
                          7 horas antes de que comience.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Divider -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="height:1px;background:rgba(255,255,255,.06)"></td></tr>
            </table>

            <!-- Event details row -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="33%" style="padding:24px 40px;border-right:1px solid rgba(255,255,255,.06)">
                  <p style="margin:0 0 4px;font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#3a3a38">Fecha</p>
                  <p style="margin:0;font-size:15px;font-weight:700;color:#ede8df">17 ABR</p>
                </td>
                <td width="33%" style="padding:24px 28px;border-right:1px solid rgba(255,255,255,.06)">
                  <p style="margin:0 0 4px;font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#3a3a38">Horario</p>
                  <p style="margin:0;font-size:15px;font-weight:700;color:#ede8df">19:00 — 02:00</p>
                </td>
                <td width="33%" style="padding:24px 28px">
                  <p style="margin:0 0 4px;font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#3a3a38">Lugar</p>
                  <p style="margin:0;font-size:15px;font-weight:700;color:#ede8df">Por revelar</p>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="padding:24px 40px;background:#080808;border:1px solid rgba(255,255,255,.04);border-top:none">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="margin:0;font-size:10px;color:#3a3a38;line-height:1.6">
                    La inscripcion no garantiza acceso al evento.<br>
                    Proceso de seleccion privado e intransferible.
                  </p>
                </td>
                <td align="right">
                  <p style="margin:0;font-size:10px;color:#3a3a38">cubohouse.cl</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
}

/* ─────────────────────────────────────────
   MIDDLEWARE
───────────────────────────────────────── */
app.set('trust proxy', 1);
app.use(helmet());
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://cubohouse.cl',
  'https://www.cubohouse.cl',
  'https://cubohouse.netlify.app',
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('CORS no permitido'));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
}));
app.use(express.json());

// Rate limit: max 3 inscripciones por IP cada 15 min
const inscribirseLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { error: 'Demasiadas solicitudes. Intenta mas tarde.' },
  validate: { xForwardedForHeader: false },
});

// Rate limit para rutas admin
const adminLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Demasiadas solicitudes.' },
  validate: { xForwardedForHeader: false },
});

/* ─────────────────────────────────────────
   MIDDLEWARE DE AUTENTICACION ADMIN
───────────────────────────────────────── */
function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!token || token !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'No autorizado.' });
  }
  next();
}

/* ─────────────────────────────────────────
   RUTAS PUBLICAS
───────────────────────────────────────── */

// Health check
app.get('/health', (req, res) => res.json({ ok: true }));

// Contador de inscritos (solo el numero, sin datos personales)
app.get('/api/contador', async (req, res) => {
  const { count, error } = await supabase
    .from('inscritos')
    .select('*', { count: 'exact', head: true });

  if (error) return res.status(500).json({ error: 'Error al obtener contador.' });
  res.json({ total: count });
});

// Inscribirse a la lista de espera
app.post('/api/inscribirse', inscribirseLimit, async (req, res) => {
  const { nombre, edad, email, instagram, ciudad, rut, telefono } = req.body;

  // Validaciones
  if (!nombre || nombre.trim().length < 2)
    return res.status(400).json({ error: 'Nombre invalido.' });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Correo invalido.' });
  if (!edad || isNaN(edad) || Number(edad) < 18)
    return res.status(400).json({ error: 'Debes tener 18 anos o mas.' });
  if (!ciudad || ciudad.trim().length < 2)
    return res.status(400).json({ error: 'Ciudad invalida.' });
  if (!rut || rut.trim().length < 3)
    return res.status(400).json({ error: 'RUT invalido.' });
  if (!telefono || telefono.trim().length < 8)
    return res.status(400).json({ error: 'Telefono invalido.' });

  const { data, error } = await supabase
    .from('inscritos')
    .insert([{
      nombre:    nombre.trim(),
      edad:      Number(edad),
      email:     email.toLowerCase().trim(),
      instagram: instagram ? instagram.trim() : null,
      ciudad:    ciudad.trim(),
      rut:       rut.trim(),
      telefono:  telefono.trim(),
    }])
    .select('id')
    .single();

  if (error) {
    // Email duplicado
    if (error.code === '23505')
      return res.status(409).json({ error: 'Este correo ya esta registrado.' });
    console.error('DB insert error:', error);
    return res.status(500).json({ error: 'Error al guardar solicitud.' });
  }

  // Responder inmediatamente — email se envía en background
  res.status(201).json({ ok: true, id: data.id });

  // Email de confirmacion al inscrito (fire-and-forget, no bloquea)
  sendEmail({
    to:      email,
    subject: 'Recibimos tu solicitud — CUBO HOUSE',
    html: emailConfirmacion(nombre.trim()),
  }).catch(e => console.error('Mail error:', e.message));
});

/* ─────────────────────────────────────────
   RUTAS DE ADMINISTRADOR
   Requieren header: x-admin-token: <ADMIN_SECRET>
───────────────────────────────────────── */

// Ver todos los inscritos (con filtros opcionales)
app.get('/api/admin/inscritos', requireAdmin, adminLimit, async (req, res) => {
  const { elegido, ciudad, q, limit = 200, offset = 0 } = req.query;

  let query = supabase
    .from('inscritos')
    .select('id, nombre, edad, email, instagram, ciudad, rut, telefono, elegido, notificado, created_at')
    .order('created_at', { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1);

  if (elegido !== undefined) query = query.eq('elegido', elegido === 'true');
  if (ciudad)               query = query.ilike('ciudad', `%${ciudad}%`);
  if (q)                    query = query.or(`nombre.ilike.%${q}%,email.ilike.%${q}%`);

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ inscritos: data, total: count });
});

// Marcar / desmarcar como elegido
app.patch('/api/admin/inscritos/:id/elegir', requireAdmin, adminLimit, async (req, res) => {
  const { id } = req.params;
  const { elegido } = req.body;

  if (typeof elegido !== 'boolean')
    return res.status(400).json({ error: 'Campo "elegido" debe ser true o false.' });

  const { data, error } = await supabase
    .from('inscritos')
    .update({ elegido })
    .eq('id', id)
    .select('id, nombre, elegido')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true, inscrito: data });
});

// Notificar a TODOS los elegidos que aun no han sido notificados
app.post('/api/admin/notificar', requireAdmin, adminLimit, async (req, res) => {
  const { data: elegidos, error } = await supabase
    .from('inscritos')
    .select('id, nombre, email')
    .eq('elegido', true)
    .eq('notificado', false);

  if (error) return res.status(500).json({ error: error.message });
  if (!elegidos.length) return res.json({ ok: true, enviados: 0 });

  const resultados = [];

  for (const p of elegidos) {
    try {
      await sendEmail({
        to:      p.email,
        subject: 'Fuiste seleccionado — CUBO HOUSE',
        html:    emailElegido(p.nombre),
      });

      // Marcar como notificado
      await supabase.from('inscritos').update({ notificado: true }).eq('id', p.id);
      resultados.push({ id: p.id, ok: true });
    } catch (err) {
      resultados.push({ id: p.id, ok: false, error: err.message });
    }
  }

  res.json({ ok: true, enviados: resultados.filter(r => r.ok).length, resultados });
});

// Enviar ubicacion a elegidos notificados (el dia del evento)
app.post('/api/admin/enviar-ubicacion', requireAdmin, adminLimit, async (req, res) => {
  const { ubicacion } = req.body;
  if (!ubicacion) return res.status(400).json({ error: 'Falta la ubicacion.' });

  const { data: elegidos, error } = await supabase
    .from('inscritos')
    .select('id, nombre, email')
    .eq('elegido', true)
    .eq('notificado', true);

  if (error) return res.status(500).json({ error: error.message });
  if (!elegidos.length) return res.json({ ok: true, enviados: 0 });

  const resultados = [];

  for (const p of elegidos) {
    try {
      await sendEmail({
        to:      p.email,
        subject: 'La ubicacion — CUBO HOUSE esta noche',
        html:    emailUbicacion(p.nombre, ubicacion),
      });
      resultados.push({ id: p.id, ok: true });
    } catch (err) {
      resultados.push({ id: p.id, ok: false, error: err.message });
    }
  }

  res.json({ ok: true, enviados: resultados.filter(r => r.ok).length, resultados });
});

// Eliminar inscrito
app.delete('/api/admin/inscritos/:id', requireAdmin, adminLimit, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('inscritos')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

/* ─────────────────────────────────────────
   START
───────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`\n  CUBO HOUSE backend corriendo en http://localhost:${PORT}\n`);
});
