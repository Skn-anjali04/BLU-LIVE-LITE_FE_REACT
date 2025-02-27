export const ONLY_NUMBER_REGEX = /^[0-9]*$/;
export const PHONE_REGEX = /^[+]?[0-9]{10,14}$/;
export const EMAIL_ID_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
export const NUM_DECIMAL_REGEX = /^[0-9]\d*(\.\d+)?$/;

export const PHONE_NUMBER_REGEX = /^[0][1-9]\d{9}$|^[1-9]\d{9}$/;
export const GENERIC_PHONE_NUMBER_REGEX = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/;
export const URL_REGEX = /^([Hh][Tt][Tt][Pp][Ss]:|[Hh][Tt][Tt][Pp]:|[Ww][Ww][Ww].)/;
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,15}$/;
export const USERNAME_REGEX=/^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{4,}$/;

export const  USEREMAIL_REGEX=/^[a-z0-9._%+-]+@skandhams\.com$/;
export const IP_ADDRESS_REGEX = /^(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)$/;
export const DNS_REGEX=/^(?:(?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)+[A-Za-z]{2,6}$/
