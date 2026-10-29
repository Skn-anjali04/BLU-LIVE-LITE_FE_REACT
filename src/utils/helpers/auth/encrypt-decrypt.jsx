// userRole and user (email) in sessionStorage are only used for display and to pick the screens.
// They used to be encrypted with a key pair shipped in the bundle (VAPT INF001), which protected
// nothing: the backend checks the role from the token on every request (403 otherwise).
// The function names stay so the callers do not change.

export function encryptData(value) {
  return value;
}

export function decryptData(value) {
  return value;
}
