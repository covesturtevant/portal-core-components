import { of } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { map, catchError, takeUntil } from 'rxjs/operators';

/**
 * Convenience method for utiliizing RxJS ajax.getJSON
 * @param {string} url
 * @param {any} callback
 * @param {any} errorCallback
 * @param {any} cancellationSubject$
 * @param {Object|undefined} headers
 * @return RxJS subscription
 */
export const getJson = (
  url,
  callback,
  errorCallback,
  cancellationSubject$,
  headers = undefined,
) => {
  const rxObs$ = ajax.getJSON(url, headers).pipe(
    map((response) => {
      if (typeof callback === 'function') {
        return of(callback(response));
      }
      return of(response);
    }),
    catchError((error) => {
      console.error(error); // eslint-disable-line no-console
      if (typeof errorCallback === 'function') {
        return of(errorCallback(error));
      }
      return of(error);
    }),
    takeUntil(cancellationSubject$),
  );

  // Placeholders for subscriber events, handled upstream in observable
  return rxObs$.subscribe(
    response => response,
    error => error,
    complete => complete,
  );
};

export default getJson;
