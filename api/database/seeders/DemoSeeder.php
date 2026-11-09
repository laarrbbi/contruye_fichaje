<?php

namespace Database\Seeders;

use App\Models\Application;
use App\Models\Conversation;
use App\Models\JobPost;
use App\Models\Message;
use App\Models\Project;
use App\Models\ProjectUnlock;
use App\Models\User;
use App\Services\Chat;
use App\Services\Credits;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;

/**
 * Demo data, for a local run and the preview: every company is prefixed
 * [DEMO], every address is @example.es, every password is "password".
 *
 * Accounts:
 *   admin@example.es        admin
 *   empresa@example.es      employer (one offer unlocked, one free)
 *   trabajador@example.es   worker
 *   cliente@example.es      client (two requests)
 *   reformas@example.es     provider (6 credits)
 */
class DemoSeeder extends Seeder
{
    public function run(): void
    {
        Notification::fake();
        $password = Hash::make('password');
        $make = fn (array $attrs) => User::query()->create($attrs + ['password' => $password, 'locale' => 'es', 'email_verified_at' => now()]);

        $make(['name' => 'Administración', 'email' => 'admin@example.es', 'role' => User::ADMIN, 'province' => '28']);

        // ── Empleo: companies ───────────────────────────────────────────────
        $companies = [
            ['empresa@example.es', 'Marta Ruiz', '[DEMO] Edificaciones Castellana S.L.', 'obra_nueva', '50-249', '28', 'Madrid', 'Promotora y constructora de vivienda residencial en la Comunidad de Madrid. Más de 20 años levantando edificios de obra nueva.'],
            ['rrhh@levante.example.es', 'Jordi Puig', '[DEMO] Construcciones Levante Mar S.A.', 'obra_civil', '250+', '46', 'Valencia', 'Obra civil y edificación en la Comunitat Valenciana: puertos, carreteras y vivienda.'],
            ['obras@sur.example.es', 'Rocío Medina', '[DEMO] Reformas y Obras del Sur S.L.', 'reformas', '10-49', '41', 'Sevilla', 'Rehabilitación de edificios y reformas integrales en Sevilla y Huelva.'],
            ['personal@norte.example.es', 'Iker Etxeberria', '[DEMO] Instalaciones Norte S.L.', 'instalaciones', '10-49', '48', 'Bilbao', 'Instalaciones eléctricas, fontanería y climatización para obra nueva.'],
        ];
        $employers = [];
        foreach ($companies as [$email, $name, $company, $sector, $size, $province, $city, $about]) {
            $user = $make(['name' => $name, 'email' => $email, 'phone' => '+3491'.random_int(1000000, 9999999), 'role' => User::EMPLOYER, 'province' => $province, 'city' => $city]);
            $user->employerProfile()->create(['company_name' => $company, 'sector' => $sector, 'size' => $size, 'description' => $about, 'cif' => 'B'.random_int(10000000, 99999999)]);
            $employers[] = $user;
        }
        Credits::grant($employers[0], 3, 'grant', null, 'demo');

        // ── Empleo: workers ────────────────────────────────────────────────
        $workers = [
            ['trabajador@example.es', 'Javier Morales Díaz', '28', 'Getafe', 'albanil', 12, 'Oficial de primera, ladrillo cara vista', 'Llevo 12 años en obra nueva: fábrica de ladrillo, tabiquería y revestimientos. Trabajo con planos y tengo la TPC al día.', ['oficial_primera', 'alicatador']],
            ['andrei@example.es', 'Andrei Popescu', '28', 'Alcalá de Henares', 'encofrador', 9, 'Encofrador con sistema Peri y Ulma', 'Encofrado de pilares, muros y forjados. Experiencia en edificios de hasta 14 plantas.', ['ferrallista']],
            ['youssef@example.es', 'Youssef El Amrani', '08', 'L\'Hospitalet de Llobregat', 'ferrallista', 6, 'Ferrallista, montaje y atado', 'Montaje de armaduras en losas y muros pantalla. Disponible para desplazarme.', ['peon']],
            ['lucia@example.es', 'Lucía Fernández Gil', '46', 'Valencia', 'electricista', 10, 'Electricista REBT, categoría especialista', 'Instalaciones de baja tensión en vivienda y terciario. Carné de instalador autorizado.', ['energia_solar']],
            ['carlos@example.es', 'Carlos Navarro Ortega', '41', 'Dos Hermanas', 'gruista', 15, 'Gruista con carné de operador de grúa torre', 'Grúa torre y autopropulsada. 15 años sin un solo incidente.', ['operador_maquinaria']],
            ['oksana@example.es', 'Oksana Kovalenko', '28', 'Madrid', 'pintor', 7, 'Pintora y acabados decorativos', 'Pintura plástica, esmaltes, estucos y papel pintado. Rápida y limpia.', ['pladur']],
            ['miguel@example.es', 'Miguel Ángel Torres', '29', 'Málaga', 'fontanero', 11, 'Fontanero, instalaciones de saneamiento', 'Fontanería en obra nueva y reformas: multicapa, PPR y saneamiento.', ['climatizacion', 'gas']],
            ['diego@example.es', 'Diego Herrera Ramos', '50', 'Zaragoza', 'jefe_obra', 18, 'Jefe de obra, arquitecto técnico', 'Dirección de ejecución de promociones residenciales de 30 a 120 viviendas. Planificación, costes y seguridad.', ['encargado', 'arquitecto_tecnico']],
            ['ana@example.es', 'Ana Belén Castro', '48', 'Barakaldo', 'carpintero', 5, 'Carpintera de obra y montaje de puertas', 'Montaje de premarcos, puertas de paso y armarios empotrados.', ['parquetista']],
            ['pablo@example.es', 'Pablo Jiménez Soto', '28', 'Leganés', 'peon', 2, 'Peón de obra con ganas de aprender', 'Dos años de peón en obra nueva. Curso PRL de 20 h. Busco crecer como oficial.', []],
        ];
        $workerUsers = [];
        foreach ($workers as $i => [$email, $name, $province, $city, $trade, $years, $headline, $bio, $others]) {
            $user = $make(['name' => $name, 'email' => $email, 'phone' => '+346'.random_int(10000000, 99999999), 'role' => User::WORKER, 'province' => $province, 'city' => $city]);
            $user->workerProfile()->create([
                'trade' => $trade,
                'other_trades' => $others,
                'years_experience' => $years,
                'headline' => $headline,
                'bio' => $bio,
                'availability' => ['immediate', 'two_weeks', 'immediate', 'month'][$i % 4],
                'has_tpc' => $i % 5 !== 4,
                'prl_training' => $years > 5 ? '60h' : '20h',
                'driving_license' => $i % 3 !== 2,
                'own_vehicle' => $i % 2 === 0,
                'work_permit' => true,
                'willing_to_travel' => $i % 3 === 1,
                'languages' => $i % 3 === 1 ? ['es', 'ro'] : ['es'],
                'visible' => true,
            ]);
            $workerUsers[$email] = $user;
        }

        // ── Empleo: offers ─────────────────────────────────────────────────
        $offers = [
            [0, 'Oficial de primera albañil para obra de 48 viviendas', 'albanil', '28', 'Valdebebas', 'fijo_obra', 1900, 2300, 'mes', 3, 4, true, 'unlocked', 'Edificio residencial de 48 viviendas, 6 plantas y 2 sótanos. Fábrica de ladrillo cara vista, tabiquería de ladrillo y trasdosados. Horario de 8:00 a 17:00, viernes intensiva.', "TPC en vigor\nMínimo 3 años como oficial de primera\nCurso PRL de 60 h"],
            [0, 'Encofrador para estructura de hormigón armado', 'encofrador', '28', 'Getafe', 'fijo_obra', 15, 18, 'hora', 2, 3, true, 'premium', 'Estructura de 9 plantas con forjados reticulares. Encofrado con sistema de mesas. Inicio inmediato.', 'Experiencia en encofrado de forjados y pilares'],
            [0, 'Peón de obra para urbanización', 'peon', '28', 'Alcorcón', 'temporal', 1450, 1550, 'mes', 4, 0, false, 'free', 'Peón para trabajos de urbanización y ayudas a oficios. Contrato de 6 meses con posibilidad de continuidad.', 'Curso PRL de 20 h'],
            [1, 'Gruista de grúa torre — puerto de Valencia', 'gruista', '46', 'Valencia', 'indefinido', 2400, 2800, 'mes', 1, 5, true, 'unlocked', 'Manejo de grúa torre en obra portuaria. Turno de mañana.', 'Carné de operador de grúa torre'],
            [1, 'Ferrallistas para losa de cimentación', 'ferrallista', '46', 'Sagunto', 'fijo_obra', 16, 19, 'hora', 3, 2, true, 'free', 'Montaje de armaduras en losa de cimentación de 3.000 m². Alojamiento incluido para desplazados.', null],
            [2, 'Pintor/a para rehabilitación de fachadas', 'pintor', '41', 'Sevilla', 'temporal', 1600, 1850, 'mes', 2, 2, false, 'free', 'Rehabilitación de fachadas en el centro histórico. Trabajo en andamio.', 'Valorable experiencia en morteros de cal'],
            [2, 'Jefe/a de obra para reformas integrales', 'jefe_obra', '41', 'Sevilla', 'indefinido', 36000, 42000, 'ano', 1, 6, false, 'free', 'Coordinación de 6-8 reformas simultáneas: planificación, compras y trato con el cliente.', "Arquitecto técnico o ingeniero de edificación\nCarné B y vehículo propio"],
            [3, 'Electricista oficial de primera', 'electricista', '48', 'Bilbao', 'indefinido', 2100, 2500, 'mes', 2, 4, true, 'unlocked', 'Instalaciones eléctricas en edificios de vivienda y oficinas. Lectura de esquemas unifilares.', 'Carné de instalador valorable'],
            [3, 'Fontanero para obra nueva', 'fontanero', '48', 'Getxo', 'fijo_obra', 1900, 2200, 'mes', 1, 3, false, 'free', 'Instalación de fontanería y saneamiento en 30 viviendas unifamiliares.', null],
            [1, 'Operador/a de retroexcavadora', 'operador_maquinaria', '12', 'Castellón de la Plana', 'temporal', 2000, 2300, 'mes', 1, 3, false, 'free', 'Movimiento de tierras para urbanización industrial.', 'Carné C valorable'],
        ];
        $posts = [];
        foreach ($offers as [$e, $title, $trade, $province, $city, $contract, $min, $max, $period, $vacancies, $exp, $tpc, $plan, $description, $requirements]) {
            $post = $employers[$e]->jobPosts()->create([
                'title' => $title, 'trade' => $trade, 'province' => $province, 'city' => $city,
                'contract_type' => $contract, 'workday' => 'completa',
                'salary_min' => $min, 'salary_max' => $max, 'salary_period' => $period,
                'start' => 'inmediata', 'vacancies' => $vacancies, 'experience_min' => $exp,
                'description' => $description, 'requirements' => $requirements,
                'requires_tpc' => $tpc, 'requires_license' => false, 'accommodation' => str_contains($description, 'Alojamiento'),
                'status' => 'active', 'expires_at' => now()->addDays(random_int(10, 30)),
            ]);
            if ($plan !== 'free') {
                $post->forceFill(['unlocked_until' => now()->addDays(25), 'featured_until' => $plan === 'premium' ? now()->addDays(25) : null])->save();
            }
            $posts[] = $post;
        }

        // Applications: the main demo company has applicants on its unlocked
        // offer (chat open) and on its free one (locked).
        $apply = fn (JobPost $post, User $worker, ?string $message = null, string $status = 'new') => Application::query()->create([
            'job_post_id' => $post->id, 'worker_id' => $worker->id, 'message' => $message, 'status' => $status,
        ]);
        $apply($posts[0], $workerUsers['trabajador@example.es'], 'Hola, vivo en Getafe y puedo empezar mañana. Llamadme al 612 345 678.', 'shortlisted');
        $apply($posts[0], $workerUsers['pablo@example.es'], 'Busco crecer como oficial, tengo dos años de peón.');
        $apply($posts[0], $workerUsers['oksana@example.es']);
        $apply($posts[1], $workerUsers['andrei@example.es'], 'Tengo experiencia con mesas de encofrado Ulma.');
        $apply($posts[2], $workerUsers['pablo@example.es'], 'Disponible desde ya.');
        $apply($posts[2], $workerUsers['trabajador@example.es']);
        $apply($posts[2], $workerUsers['youssef@example.es'], 'Escríbeme a youssef@example.es');
        $apply($posts[3], $workerUsers['carlos@example.es']);
        $apply($posts[7], $workerUsers['lucia@example.es']);

        $chat = Chat::open('empleo', $employers[0], $workerUsers['trabajador@example.es'], $posts[0]->id);
        $this->messages($chat->id, [
            [$employers[0]->id, 'Hola Javier, hemos visto tu candidatura para la obra de Valdebebas. ¿Podrías pasarte el lunes a las 9:00 por la caseta de obra?'],
            [$workerUsers['trabajador@example.es']->id, 'Buenos días, Marta. Sí, sin problema. ¿Llevo la TPC y el certificado de PRL?'],
            [$employers[0]->id, 'Perfecto, trae ambos y el DNI. Pregunta por Luis, el encargado.'],
        ]);

        // ── Obras: people ──────────────────────────────────────────────────
        $client = $make(['name' => 'Elena Sánchez Prieto', 'email' => 'cliente@example.es', 'phone' => '+34655123456', 'role' => User::CLIENT, 'province' => '28', 'city' => 'Madrid']);
        $client2 = $make(['name' => 'Raúl Domínguez', 'email' => 'raul@example.es', 'phone' => '+34644987654', 'role' => User::CLIENT, 'province' => '46', 'city' => 'Valencia']);
        $client3 = $make(['name' => 'Carmen Vidal', 'email' => 'carmen@example.es', 'phone' => '+34633111222', 'role' => User::CLIENT, 'province' => '28', 'city' => 'Pozuelo de Alarcón']);

        $requests = [
            [$client, 'Reforma integral de piso de 85 m²', 'reforma_integral', '28', 'Madrid', '28015', 'piso', '30k_100k', '1_3_meses', 'Piso de 1970 en Chamberí: 3 dormitorios, cocina y 2 baños. Queremos tirar tabiques para abrir la cocina al salón, cambiar instalación eléctrica y fontanería, suelos de tarima y carpintería exterior.'],
            [$client, 'Cambiar bañera por plato de ducha', 'reforma_bano', '28', 'Madrid', '28015', 'piso', 'hasta_3k', 'urgente', 'Baño de 4 m². Quitar la bañera, poner plato de ducha extraplano de 140x70 con mampara y alicatar la zona afectada.'],
            [$client2, 'Impermeabilizar terraza de ático', 'impermeabilizacion', '46', 'Valencia', '46021', 'piso', '3k_10k', '1_3_meses', 'Terraza de 40 m² con filtraciones al piso de abajo. Levantar solado, impermeabilizar con lámina y volver a solar.'],
            [$client3, 'Construcción de vivienda unifamiliar', 'obra_nueva', '28', 'Pozuelo de Alarcón', '28223', 'solar', 'mas_100k', '3_6_meses', 'Tenemos solar de 600 m² y proyecto básico de vivienda de 220 m² en dos plantas. Buscamos constructora para ejecución llave en mano.'],
            [$client3, 'Instalación de aerotermia y suelo radiante', 'climatizacion', '28', 'Pozuelo de Alarcón', '28223', 'casa', '10k_30k', 'flexible', 'Casa de 180 m² con caldera de gasoil. Queremos pasar a aerotermia con suelo radiante en planta baja.'],
        ];
        $projects = [];
        foreach ($requests as [$owner, $title, $category, $province, $city, $cp, $type, $budget, $timing, $description]) {
            $projects[] = $owner->projects()->create([
                'title' => $title, 'category' => $category, 'description' => $description, 'province' => $province,
                'city' => $city, 'postal_code' => $cp, 'property_type' => $type, 'budget' => $budget,
                'timing' => $timing, 'status' => 'open', 'expires_at' => now()->addDays(40),
            ]);
        }

        // ── Obras: companies that do the work ──────────────────────────────
        $providersData = [
            ['reformas@example.es', 'Sergio Blanco', '[DEMO] Reformas Blanco Madrid S.L.', ['reforma_integral', 'reforma_bano', 'reforma_cocina', 'pintura', 'suelos'], ['28', '45', '19'], 2008, 'Reformas integrales de pisos y locales en Madrid. Presupuesto cerrado y plazos por contrato.'],
            ['info@climasol.example.es', 'Nuria Gómez', '[DEMO] Climasol Instalaciones', ['climatizacion', 'energia_solar', 'electricidad', 'fontaneria'], ['28', '40', '05'], 2014, 'Aerotermia, suelo radiante, placas solares y climatización.'],
            ['hola@impermea.example.es', 'Vicent Ferrer', '[DEMO] Impermea Levante', ['impermeabilizacion', 'cubiertas_tejados', 'rehabilitacion_fachada'], ['46', '03', '12'], 2001, 'Impermeabilización de terrazas y cubiertas con garantía de 10 años.'],
            ['obra@casasdelsol.example.es', 'Alberto Rey', '[DEMO] Casas del Sol Constructora', ['obra_nueva', 'ampliacion', 'reforma_integral', 'piscinas'], ['28', '45'], 1996, 'Construcción de viviendas unifamiliares llave en mano.'],
        ];
        $providers = [];
        foreach ($providersData as [$email, $name, $company, $categories, $provinces, $year, $about]) {
            $user = $make(['name' => $name, 'email' => $email, 'phone' => '+3491'.random_int(1000000, 9999999), 'role' => User::PROVIDER, 'province' => $provinces[0], 'city' => null]);
            $user->providerProfile()->create(['company_name' => $company, 'categories' => $categories, 'provinces' => $provinces, 'founded_year' => $year, 'description' => $about, 'listed' => true]);
            $providers[] = $user;
        }
        Credits::grant($providers[0], 6, 'grant', null, 'demo');
        Credits::grant($providers[1], 4, 'grant', null, 'demo');

        // One request already answered by a company, with its chat.
        $unlock = function (User $provider, Project $project) {
            ProjectUnlock::query()->create(['project_id' => $project->id, 'provider_id' => $provider->id, 'credits' => $project->cost()]);
            $project->increment('unlocks_count');

            return Chat::open('obras', $provider, $project->client, null, $project->id);
        };
        $c = $unlock($providers[1], $projects[4]);
        $this->messages($c->id, [
            [$providers[1]->id, 'Hola Carmen, somos Climasol. Para aerotermia con suelo radiante en 180 m² necesitamos ver la casa. ¿Le viene bien el jueves por la tarde?'],
            [$client3->id, 'Hola Nuria, el jueves a partir de las 17:00 estoy en casa.'],
        ]);
        $unlock($providers[3], $projects[3]);
    }

    /** @param  list<array{0:int,1:string}>  $lines */
    private function messages(int $conversationId, array $lines): void
    {
        $at = now()->subHours(count($lines) * 3);
        foreach ($lines as [$sender, $body]) {
            $at = $at->copy()->addMinutes(random_int(20, 160));
            $m = Message::query()->create(['conversation_id' => $conversationId, 'sender_id' => $sender, 'body' => $body]);
            $m->forceFill(['created_at' => $at, 'updated_at' => $at])->save();
        }
        Conversation::query()->whereKey($conversationId)->update(['last_message_at' => $at]);
    }
}
