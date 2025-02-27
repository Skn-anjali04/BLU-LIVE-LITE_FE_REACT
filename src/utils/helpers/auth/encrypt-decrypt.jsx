import forge from 'node-forge';

// Public Key (for encryption)
const publicKeyPem = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2SEPk7msH2OBeFWh6BuoA7ZVt4EB/aZq0S4H7C1njlr5shxK3oPiWA5PSVg6gujGKP/TWiRvsyFxfjrPgf06o2EPLBGYcCE24TW1YRN81CE63ash6h5HwBBIoCRgWGOyvJA5tGCTFJpLBksGkvjR67AE4oJ8YjRakVnmtfBEksZ2idfvNtBeyPpRM6OSosqbDOcZlQDpVTg9LsXzmvgP7m+xderi2HMD/HRAihN5YGot+jksXD4JaaicKRw0iiCykKPWZOy7ZcNYrNftKP6DCnPQDRYWD26XRG/jxXJFoQIrL6ifGMVYae6I1Kto3Eajaf0Cf+AD/IlGKxmfK7EVpwIDAQAB
-----END PUBLIC KEY-----`;

// Private Key (for decryption)
const privateKeyPem = `-----BEGIN RSA PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDZIQ+TuawfY4F4VaHoG6gDtlW3gQH9pmrRLgfsLWeOWvmyHEreg+JYDk9JWDqC6MYo/9NaJG+zIXF+Os+B/TqjYQ8sEZhwITbhNbVhE3zUITrdqyHqHkfAEEigJGBYY7K8kDm0YJMUmksGSwaS+NHrsATignxiNFqRWea18ESSxnaJ1+820F7I+lEzo5KiypsM5xmVAOlVOD0uxfOa+A/ub7F16uLYcwP8dECKE3lgai36OSxcPglpqJwpHDSKILKQo9Zk7Ltlw1is1+0o/oMKc9ANFhYPbpdEb+PFckWhAisvqJ8YxVhp7ojUq2jcRqNp/QJ/4AP8iUYrGZ8rsRWnAgMBAAECggEAOL46GuoQAFf50t/WIxlvLCEvf3hYc9hU2/vCmEc5Y+uEi7Z3HnWq5kY/FDTZfbKlbruEmW8iPdcEmO93oUnzVBUeaO7kPpF/jRWDJC56ldllT97USyHEsH3Q7QD0qMTNRhgO7IO8jErSRn++5RPfkE98x1FAfk2eSZQMBgoXcZ+uyTwEAbEyqmuvQ+yqlXyJSioaOBk9QTyYZ0RZCPMp9OP6fnP83bBaNWFu2jdKnWEGOGunhrvgvVrMHhDeqOkHqY8VMrX5Isiz+4Kbyg+dT+GHQbAFKiKudEerznFbzxfWiokQdvG12yaSSHfNhku0OO0wSf3Dbnet1C5ZVRDf4QKBgQDtx4sFl9qAiBzgCRUovSc2iDazA/Xx5fgl81mroR68j+WiAOamZwUav4C+ieOK3I0hR3I1LZ1Gpon6TuNMbSTG9Frc9KHuFb+GZoEZKwgJn1Iyw64Fyq8bZ5172yZa3UjmrpEvsXq3ko9jVaxP+SDgh92K1H6ceifr+nzGMl9E1wKBgQDpxG0HyeaKv9IpYYDKCO08Jofyqc2tiyyD7g9o8ei1KvFTFieYqC1yDa2+9eLxAFGkuCFSae6ohsUbTNZZZqnKxxj3vN0quJKddpg/UU1Xc305NlhAbQw+Xtw9Z181xw/r93bIeTXmSbIzi7rsX4jLHBjIaUxeC1bmWfvYEiTLsQKBgDgq77sVgOblwDRn0Ni7vdyS1qD46YsHsNN+JYt2VuVh9HONVO6v3TPRUt8vgVGXAbt/vgmzybgbtPIs2mJ+UbaxmBkjrHCqMIDWC97fHFnxiaA2OxBhLXYCxt+wB+Jk7UiYqfEjMoLUmwxy+240wkBnt7yIr5PVA0Mp+3lyArEnAoGBAJphl6PKKc++CLw9YUGMDahoxeVzUJroy7hBMroa8JUczA0UF4hQoNquv+zaFEsW69Q9qfv0a6Guh2OVJgYar810GUAa4XECPglxtfAy8EHtymhLRJMfsTNLkGWY7B7m3NP4NOEGc5snVmGGSScrnHqOjqtkJwQAtx4flRvIN7axAoGAY4qO6/gp3JMzerV5zn4QDGXixw2R7YEIncC2nvm1XHpks0sm93Ei34uMA3h4MFUUX+gxEPjFeCbuw3HEtS3+KvVOWFQEAm2hPcmKC76/QOYBr2OBBTdNlcV/QZsIsjmzFlL802Ic7XCPEj9BmLwsctWhaKzIR5/KgHiOQRho6FA=
-----END RSA PRIVATE KEY-----`;

// Function to encrypt password
export function encryptData(password) {
  const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
  const encrypted = publicKey.encrypt(password, 'RSA-OAEP', {
    md: forge.md.sha1.create(),
    mgf1: forge.mgf.mgf1.create(forge.md.sha1.create()),
  });
  return forge.util.encode64(encrypted); 
}

// Function to decrypt password
export function decryptData(encryptedPassword) {
  const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
  const decodedData = forge.util.decode64(encryptedPassword);
  const decrypted = privateKey.decrypt(decodedData, 'RSA-OAEP', {
    md: forge.md.sha1.create(),
    mgf1: forge.mgf.mgf1.create(forge.md.sha1.create()),
  });

  return decrypted; // Return the decrypted password
}
