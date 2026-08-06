import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function readCookie(name: string): string | null {
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Las cookies de sesión son sameSite:"none" (frontend y API viven en
 * dominios distintos), así que el browser ya no nos protege solo con eso.
 * El backend espera el mismo valor de la cookie "csrf_token" (no httpOnly,
 * se puede leer acá) repetido en este header — ver Server/src/middlewares/verifyCsrf.ts.
 * Sin esto, cualquier POST/PATCH/DELETE autenticado por cookie (cancelar
 * suscripción, borrar una sesión, etc.) empieza a devolver 403.
 */
export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  if (SAFE_METHODS.has(req.method) || !req.url.startsWith(environment.endpoint)) {
    return next(req);
  }

  const token = readCookie('csrf_token');
  if (!token) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { 'X-CSRF-Token': token } }));
};
