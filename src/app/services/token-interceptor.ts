import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { Auth } from './auth-service';

export function tokenInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {

  const auth = inject(Auth);
  const token = auth.getToken();

  let authReq = req;

  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true'
      }
    });
  }

  return next(authReq).pipe(

    catchError(error => {

  console.log("Interceptor caught error:", error, req.url);

  if (error.status === 401 &&
      !req.url.toLowerCase().includes('/auth/refresh')) {

    console.log("401 detected, attempting refresh");

    return auth.refresh().pipe(
      switchMap(res => {
        console.log("Refresh success");
        const retryReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${res.accessToken}`,
            'ngrok-skip-browser-warning': 'true'
          }
        });
        return next(retryReq);
      }),
      catchError(refreshError => {
        console.log("Refresh failed → logout");
        return auth.logout().pipe(
          switchMap(() => throwError(() => refreshError))
        );
      })
    );
  }

  return throwError(() => error);
})
  );
}

