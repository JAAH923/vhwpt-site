// Phone fields format as you type: (954) 299-6536, or 1 (954) 299-6536 with the country code.
// A number that starts with + (other than +1) or runs past 11 digits is left as typed, so a
// foreign number or an extension still fits. No separator is ever added at the end, so
// Backspace always removes a digit. The server only counts the digits (public/api/*.php).

export function formatPhone(raw: string): string {
  const t = raw.trim();
  if (t.startsWith("+") && !t.startsWith("+1")) return raw;
  let d = t.replace(/\D/g, "");
  let lead = "";
  // US area codes never start with 1, so a leading 1 is the country code.
  if (d.startsWith("1") && d.length > 1) {
    lead = "1 ";
    d = d.slice(1);
  }
  if (d.length > 10) return raw;
  if (d.length === 0) return lead.trim();
  if (d.length <= 3) return lead + d;
  if (d.length <= 6) return `${lead}(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `${lead}(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

// Format every phone field inside root, keeping the cursor after the same digit it followed.
export function formatPhoneFields(root: ParentNode = document) {
  root.querySelectorAll<HTMLInputElement>('input[type="tel"]').forEach((el) => {
    el.setAttribute("inputmode", "tel");
    el.addEventListener("input", () => {
      const before = el.value;
      const next = formatPhone(before);
      if (next === before) return;
      const caret = el.selectionStart ?? before.length;
      const digitsBefore = before.slice(0, caret).replace(/\D/g, "").length;
      el.value = next;
      let pos = next.length;
      if (caret < before.length) {
        let seen = 0;
        pos = 0;
        while (pos < next.length && seen < digitsBefore) {
          if (/\d/.test(next[pos])) seen++;
          pos++;
        }
      }
      try {
        el.setSelectionRange(pos, pos);
      } catch {
        /* some input types refuse a selection; the value is still right */
      }
    });
  });
}
