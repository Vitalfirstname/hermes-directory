export const PHONE_CODES = ["17", "25", "29", "33", "44"];
export const OWNER_CONTROLS = /[\p{Cc}\p{Zl}\p{Zp}]/u;

const PHONE = /^\+375[ -]?(?:\((17|25|29|33|44)\)|(17|25|29|33|44))[ -]?([0-9]{3})[ -]?([0-9]{2})[ -]?([0-9]{2})(?![\s\S])/;

export function parseOfficePhone(value) {
  const match = PHONE.exec(value.replace(/^ +| +$/g, ""));
  if (!match) return null;
  const [, parenthesizedCode, plainCode, first, second, third] = match;
  return { phoneCode: parenthesizedCode || plainCode, phoneDigits: first + second + third };
}

export function formatSubscriber(digits) {
  return [digits.slice(0, 3), digits.slice(3, 5), digits.slice(5, 7)].filter(Boolean).join("-");
}

function normalizeWebsite(value) {
  const address = value.trim();
  if (!address) return "";
  const website = /^[a-z][a-z0-9+.-]*:\/\//i.test(address) ? address : `https://${address}`;
  if (/[\s\p{Cc}\\]/u.test(website)) return null;
  // Read the original host and port before URL() can repair or discard them.
  const authority = /^https?:\/\/([^/?#]+)/i.exec(website)?.[1];
  const hostAndPort = authority?.slice(authority.lastIndexOf("@") + 1);
  const parts = /^(\[[0-9a-f:.]+\]|[^:[\]%]+)(?::([0-9]{1,5}))?$/i.exec(hostAndPort ?? "");
  if (!parts) return null;
  const [, originalHost, port] = parts;
  if (port !== undefined && (Number(port) < 1 || Number(port) > 65535)) return null;

  try {
    const { hostname } = new URL(website);
    const host = hostname.replace(/\.$/, "");
    if (host === "localhost") return /^localhost$/i.test(originalHost) ? website : null;
    if (host.startsWith("[")) return website;
    if (/^(?:[0-9]+\.){3}[0-9]+$/.test(host)) {
      return originalHost === host ? website : null;
    }
    const labels = host.split(".");
    const validLabels = labels.every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label));
    return validLabels && /^(?:[a-z]{2,63}|xn--[a-z0-9-]+)$/i.test(labels.at(-1)) && labels.length > 1
      ? website
      : null;
  } catch {
    return null;
  }
}

export function validateOfficeForm(form) {
  const { tower, number, phoneCode, phoneDigits } = form;
  const owner = form.owner.trim();
  const website = normalizeWebsite(form.website);
  const errors = {};
  if (tower !== "A" && tower !== "B") errors.tower = "Выберите башню A или B.";
  if (!/^[0-9]{1,2}$/.test(number)) errors.number = "Введите одну или две цифры.";
  if (!owner || OWNER_CONTROLS.test(form.owner)) {
    errors.owner = "Введите название до 100 символов без управляющих символов и переносов строк.";
  } else if (Array.from(owner).length > 100) {
    errors.owner = "Название должно быть не длиннее 100 символов без внешних пробелов.";
  }
  if (form.legacyPhone || ((phoneCode || phoneDigits) && (!PHONE_CODES.includes(phoneCode) || !/^[0-9]{7}$/.test(phoneDigits)))) {
    errors.phone = "Выберите код и введите семь цифр либо очистите телефон.";
  }
  if (website === null) errors.website = "Введите один корректный адрес HTTP или HTTPS.";
  else if (Array.from(website).length > 200) errors.website = "Адрес с протоколом должен быть не длиннее 200 символов.";

  return {
    errors,
    payload: {
      tower,
      number,
      owner,
      phone: phoneDigits ? `+375 (${phoneCode}) ${formatSubscriber(phoneDigits)}` : "",
      website,
    },
  };
}
