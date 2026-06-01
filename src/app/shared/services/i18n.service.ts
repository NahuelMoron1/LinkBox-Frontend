import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const translations: Record<'en' | 'es', Record<string, string>> = {
  en: {
    // ── NAVBAR ──
    'nav.features':    'FEATURES',
    'nav.plans':       'PLANS',
    'nav.about':       'ABOUT',
    'nav.live':        'LIVE DASHBOARD',
    'nav.login':       'LOGIN',
    'nav.logout':      'LOGOUT',
    'nav.getAccess':   'GET ACCESS',
    'nav.langToggle':  'ES',

    // ── HERO ──
    'hero.eyebrow':    'MOTORSPORT TELEMETRY SYSTEM',
    'hero.title1':     'Your Car.',
    'hero.title2':     'Your Data.',
    'hero.title3':     'Your Edge.',
    'hero.subtitle':   "LinkBox connects your vehicle's ECU to a professional live telemetry dashboard — monitoring engine performance in real time, wherever you race.",
    'hero.getStarted': 'GET STARTED',
    'hero.learnMore':  'LEARN MORE',
    'hero.scroll':     'SCROLL',

    // ── FEATURES SECTION ──
    'features.eyebrow': 'WHAT YOU GET',
    'features.title':   'Professional telemetry, simplified.',
    'feat.1.title': 'REAL-TIME MONITORING',
    'feat.1.desc':  'Live RPM, water temperature, oil pressure, fuel pressure and more — updated every millisecond your engine is running.',
    'feat.2.title': 'SESSION RECORDING',
    'feat.2.desc':  'Capture every run automatically. Review historical data, compare sessions and identify performance trends over time.',
    'feat.3.title': 'TELEMETRY CHARTS',
    'feat.3.desc':  'Interactive multi-channel charts with zoom and pan. Correlate metrics across time and spot anomalies before they cost you a race.',
    'feat.4.title': 'GT3 DISPLAY MODE',
    'feat.4.desc':  'Professional dashboard inspired by the Porsche GT3 DDU. Switch between GT3 and Classic layouts on the fly.',

    // ── PLANS SECTION ──
    'plans.eyebrow':        'PRICING',
    'plans.title':          'Choose your plan.',
    'plan.basic.tagline':   'Monitor your car',
    'plan.pro.tagline':     'Record & analyse',
    'plan.ult.tagline':     'No limits',
    'plan.basic.cta':       'GET STARTED',
    'plan.pro.cta':         'GET PRO',
    'plan.ult.cta':         'GET ULTIMATE',
    'plan.basic.f1': 'Live dashboard',
    'plan.basic.f2': 'Real-time telemetry',
    'plan.basic.f3': 'GT3 & Classic display',
    'plan.basic.f4': 'Dark & Light mode',
    'plan.pro.f1':   'Everything in Basic',
    'plan.pro.f2':   'Session recording',
    'plan.pro.f3':   '2 saved sessions / month',
    'plan.pro.f4':   'Export to JSON',
    'plan.ult.f1':   'Everything in Pro',
    'plan.ult.f2':   'Unlimited sessions',
    'plan.ult.f3':   'Auto-save on connect',
    'plan.ult.f4':   'Priority support',
    'plans.popular': 'MOST POPULAR',

    // ── FOOTER ──
    'footer.tagline': 'Professional motorsport telemetry for every driver.',
    'footer.copy':    '© 2025 LinkBox. All rights reserved.',
    'footer.features': 'Features',
    'footer.plans':    'Plans',
    'footer.login':    'Login',
    'footer.dash':     'Dashboard',

    // ── LOGIN ──
    'login.eyebrow':   'TELEMETRY COMMAND CENTER',
    'login.welcome1':  'WELCOME',
    'login.welcome2':  'BACK',
    'login.heading':   'ACCESS',
    'login.subtitle':  'Enter your credentials to continue',
    'login.keyLabel':  'DEVICE KEY',
    'login.passLabel': 'PASSWORD',
    'login.submit':    'LOG IN',
    'login.or':        'OR',
    'login.request':   'REQUEST ACCESS',

    // ── DASHBOARD HEADER ──
    'header.sub':       'DASHBOARD',
    'header.expired':   'EXPIRED',
    'header.suspended': 'SUSPENDED',

    // ── PLAN TOOLBAR ──
    'toolbar.autoSave':    'AUTO-SAVE ON',
    'toolbar.sessions':    'SESSIONS',
    'toolbar.viewSessions':'VIEW SESSIONS',
    'toolbar.upgrade':     'UPGRADE',
    'toolbar.loading':     'LOADING...',
    'toolbar.save':        'SAVE SESSION',
    'toolbar.saveUnlimited': 'SAVE SESSION (UNLIMITED)',
    'toolbar.saveUpgrade': 'UPGRADE TO SAVE',

    // ── SAVED SESSIONS ──
    'sess.title':     'SAVED SESSIONS',
    'sess.back':      'BACK',
    'sess.refresh':   'REFRESH',
    'sess.loading':   'LOADING...',
    'sess.listTitle': 'SESSIONS',
    'sess.search':    'SEARCH SESSIONS...',
    'sess.noData':    'NO SESSIONS FOUND',
    'sess.noDataHint':'Save sessions from the dashboard to see them here',
    'sess.export':    'EXPORT',
    'sess.delete':    'DELETE',
    'sess.id':        'SESSION ID',
    'sess.status':    'STATUS',
    'sess.duration':  'DURATION',
    'sess.records':   'TOTAL RECORDS',
    'sess.start':     'START',
    'sess.end':       'END',
    'sess.telemetry': 'TELEMETRY DATA',
    'sess.select':    'SELECT A SESSION FROM THE LIST',
    'sess.loadData':  'SELECT A SESSION TO VIEW TELEMETRY DATA',
    'sess.completed': 'COMPLETED',
    'sess.draft':     'DRAFT',
    'sess.recording': 'RECORDING',

    // ── TABLE HEADERS ──
    'tbl.time':      'TIME',
    'tbl.rpm':       'RPM',
    'tbl.water':     'WATER',
    'tbl.oilTemp':   'OIL TEMP',
    'tbl.oilPress':  'OIL PRESS',
    'tbl.fuelPress': 'FUEL PRESS',
    'tbl.afr':       'AFR',
    'tbl.gear':      'GEAR',

    // ── DASHBOARD ──
    'dash.gt3':      'GT3',
    'dash.classic':  'CLASSIC',
    'dash.live':     'LIVE',
    'dash.offline':  'OFFLINE',
    'dash.stopped':  'STOPPED',
    'dash.oilTemp':  'Oil Temp',
    'dash.oilPress': 'Oil Press',
    'dash.waterTemp':'Water Temp',
    'dash.fuelPress':'Fuel Press',
    'dash.sonda':    'Sonda (AFR)',
    'dash.system':   'System',
    'dash.gear':     'GEAR',
    'dash.kmh':      'km/h',
    'dash.rpm':      'RPM',
    'dash.maxRpm':   '/ 7000 RPM',

    // ── CHART ──
    'chart.reset':   'RESET ZOOM',
    'chart.noData':  'Your data will appear here once the telemetry logger starts',
  },

  es: {
    // ── NAVBAR ──
    'nav.features':    'CARACTERÍSTICAS',
    'nav.plans':       'PLANES',
    'nav.about':       'NOSOTROS',
    'nav.live':        'PANEL EN VIVO',
    'nav.login':       'INGRESAR',
    'nav.logout':      'SALIR',
    'nav.getAccess':   'OBTENER ACCESO',
    'nav.langToggle':  'EN',

    // ── HERO ──
    'hero.eyebrow':    'SISTEMA DE TELEMETRÍA MOTORSPORT',
    'hero.title1':     'Tu Auto.',
    'hero.title2':     'Tus Datos.',
    'hero.title3':     'Tu Ventaja.',
    'hero.subtitle':   'LinkBox conecta la ECU de tu vehículo a un panel de telemetría profesional en tiempo real — monitoreando el rendimiento del motor, donde sea que corras.',
    'hero.getStarted': 'COMENZAR',
    'hero.learnMore':  'SABER MÁS',
    'hero.scroll':     'DESLIZAR',

    // ── FEATURES SECTION ──
    'features.eyebrow': 'QUÉ INCLUYE',
    'features.title':   'Telemetría profesional, simplificada.',
    'feat.1.title': 'MONITOREO EN TIEMPO REAL',
    'feat.1.desc':  'RPM, temperatura del agua, presión del aceite, presión del combustible y más — actualizado cada milisegundo que tu motor funciona.',
    'feat.2.title': 'GRABACIÓN DE SESIONES',
    'feat.2.desc':  'Capturá cada corrida automáticamente. Revisá datos históricos, comparás sesiones e identificás tendencias de rendimiento a lo largo del tiempo.',
    'feat.3.title': 'GRÁFICOS DE TELEMETRÍA',
    'feat.3.desc':  'Gráficos interactivos multicanal con zoom y paneo. Correlacioná métricas en el tiempo y detectá anomalías antes de que te cuesten una carrera.',
    'feat.4.title': 'MODO DISPLAY GT3',
    'feat.4.desc':  'Panel profesional inspirado en el DDU del Porsche GT3. Cambiá entre layouts GT3 y Clásico al instante.',

    // ── PLANS SECTION ──
    'plans.eyebrow':       'PRECIOS',
    'plans.title':         'Elegí tu plan.',
    'plan.basic.tagline':  'Monitoreá tu auto',
    'plan.pro.tagline':    'Grabá y analizá',
    'plan.ult.tagline':    'Sin límites',
    'plan.basic.cta':      'COMENZAR',
    'plan.pro.cta':        'OBTENER PRO',
    'plan.ult.cta':        'OBTENER ULTIMATE',
    'plan.basic.f1': 'Panel en vivo',
    'plan.basic.f2': 'Telemetría en tiempo real',
    'plan.basic.f3': 'Display GT3 y Clásico',
    'plan.basic.f4': 'Modo oscuro y claro',
    'plan.pro.f1':   'Todo lo de Basic',
    'plan.pro.f2':   'Grabación de sesiones',
    'plan.pro.f3':   '2 sesiones guardadas / mes',
    'plan.pro.f4':   'Exportar a JSON',
    'plan.ult.f1':   'Todo lo de Pro',
    'plan.ult.f2':   'Sesiones ilimitadas',
    'plan.ult.f3':   'Auto-guardado al conectar',
    'plan.ult.f4':   'Soporte prioritario',
    'plans.popular': 'MÁS POPULAR',

    // ── FOOTER ──
    'footer.tagline': 'Telemetría motorsport profesional para cada piloto.',
    'footer.copy':    '© 2025 LinkBox. Todos los derechos reservados.',
    'footer.features': 'Características',
    'footer.plans':    'Planes',
    'footer.login':    'Ingresar',
    'footer.dash':     'Panel',

    // ── LOGIN ──
    'login.eyebrow':   'CENTRO DE COMANDO DE TELEMETRÍA',
    'login.welcome1':  'BIENVENIDO',
    'login.welcome2':  'DE VUELTA',
    'login.heading':   'ACCESO',
    'login.subtitle':  'Ingresá tus credenciales para continuar',
    'login.keyLabel':  'CLAVE DE DISPOSITIVO',
    'login.passLabel': 'CONTRASEÑA',
    'login.submit':    'INGRESAR',
    'login.or':        'O',
    'login.request':   'SOLICITAR ACCESO',

    // ── DASHBOARD HEADER ──
    'header.sub':       'PANEL',
    'header.expired':   'VENCIDO',
    'header.suspended': 'SUSPENDIDO',

    // ── PLAN TOOLBAR ──
    'toolbar.autoSave':     'AUTO-GUARDADO ACTIVO',
    'toolbar.sessions':     'SESIONES',
    'toolbar.viewSessions': 'VER SESIONES',
    'toolbar.upgrade':      'MEJORAR PLAN',
    'toolbar.loading':      'CARGANDO...',
    'toolbar.save':         'GUARDAR SESIÓN',
    'toolbar.saveUnlimited':'GUARDAR SESIÓN (ILIMITADO)',
    'toolbar.saveUpgrade':  'MEJORAR PARA GUARDAR',

    // ── SAVED SESSIONS ──
    'sess.title':     'SESIONES GUARDADAS',
    'sess.back':      'VOLVER',
    'sess.refresh':   'ACTUALIZAR',
    'sess.loading':   'CARGANDO...',
    'sess.listTitle': 'SESIONES',
    'sess.search':    'BUSCAR SESIONES...',
    'sess.noData':    'SIN SESIONES',
    'sess.noDataHint':'Guardá sesiones desde el panel para verlas aquí',
    'sess.export':    'EXPORTAR',
    'sess.delete':    'ELIMINAR',
    'sess.id':        'ID DE SESIÓN',
    'sess.status':    'ESTADO',
    'sess.duration':  'DURACIÓN',
    'sess.records':   'REGISTROS TOTALES',
    'sess.start':     'INICIO',
    'sess.end':       'FIN',
    'sess.telemetry': 'DATOS DE TELEMETRÍA',
    'sess.select':    'SELECCIONÁ UNA SESIÓN DE LA LISTA',
    'sess.loadData':  'SELECCIONÁ UNA SESIÓN PARA VER LOS DATOS',
    'sess.completed': 'COMPLETADA',
    'sess.draft':     'BORRADOR',
    'sess.recording': 'GRABANDO',

    // ── TABLE HEADERS ──
    'tbl.time':      'HORA',
    'tbl.rpm':       'RPM',
    'tbl.water':     'AGUA',
    'tbl.oilTemp':   'TEMP. ACEITE',
    'tbl.oilPress':  'PRES. ACEITE',
    'tbl.fuelPress': 'PRES. COMB.',
    'tbl.afr':       'AFR',
    'tbl.gear':      'MARCHA',

    // ── DASHBOARD ──
    'dash.gt3':      'GT3',
    'dash.classic':  'CLÁSICO',
    'dash.live':     'EN VIVO',
    'dash.offline':  'SIN SEÑAL',
    'dash.stopped':  'DETENIDO',
    'dash.oilTemp':  'Temp. Aceite',
    'dash.oilPress': 'Pres. Aceite',
    'dash.waterTemp':'Temp. Agua',
    'dash.fuelPress':'Pres. Comb.',
    'dash.sonda':    'Sonda (AFR)',
    'dash.system':   'Sistema',
    'dash.gear':     'MARCHA',
    'dash.kmh':      'km/h',
    'dash.rpm':      'RPM',
    'dash.maxRpm':   '/ 7000 RPM',

    // ── CHART ──
    'chart.reset':  'RESET ZOOM',
    'chart.noData': 'Los datos aparecerán aquí cuando el logger de telemetría inicie',
  },
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly STORAGE_KEY = 'linkbox-lang';

  private _lang$ = new BehaviorSubject<'en' | 'es'>('en');
  readonly lang$ = this._lang$.asObservable();

  get lang(): 'en' | 'es' { return this._lang$.value; }

  constructor() {
    const saved = localStorage.getItem(this.STORAGE_KEY) as 'en' | 'es' | null;
    if (saved === 'en' || saved === 'es') this._lang$.next(saved);
  }

  toggle(): void {
    const next = this.lang === 'en' ? 'es' : 'en';
    this._lang$.next(next);
    localStorage.setItem(this.STORAGE_KEY, next);
  }

  t(key: string): string {
    return translations[this.lang][key] ?? translations['en'][key] ?? key;
  }
}
