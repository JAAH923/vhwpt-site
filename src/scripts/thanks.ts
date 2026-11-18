// Opens the thank-you pop-up (src/components/Thanks.astro). Each form clears itself first, then
// calls this. `closeAfter` closes it on its own (the sign-up iPad), with a bar showing the time
// left; any tap on the card keeps it open. onClose runs however it closes.

type Options = {
  name?: string;
  message: string;
  note?: string;
  closeAfter?: number;
  onClose?: () => void;
};

let closer: (() => void) | null = null;

export function showThanks(o: Options) {
  const dlg = document.getElementById("thanks") as HTMLDialogElement | null;
  if (!dlg) return;
  const q = <T extends Element>(s: string) => dlg.querySelector<T>(s)!;
  const first = (o.name || "").trim().split(/\s+/)[0];
  q("[data-name]").textContent = first ? `, ${first}` : "";
  q("[data-msg]").textContent = o.message;
  const note = q<HTMLElement>("[data-note]");
  note.textContent = o.note || "";
  note.hidden = !o.note;

  // The event iPad runs from its Home Screen: keep it on the sign-up.
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  const site = dlg.querySelector<HTMLElement>("[data-site]");
  if (site) site.hidden = standalone;

  const bar = q<HTMLElement>(".thanksbar");
  const fill = q<HTMLElement>(".thanksbar i");
  let timer = 0;
  const stopTimer = () => {
    clearTimeout(timer);
    bar.hidden = true;
  };
  if (o.closeAfter) {
    bar.hidden = false;
    fill.style.transition = "none";
    fill.style.width = "100%";
    void fill.offsetWidth; // restart the bar
    fill.style.transition = `width ${o.closeAfter}ms linear`;
    fill.style.width = "0%";
    timer = window.setTimeout(() => dlg.close(), o.closeAfter);
  }

  closer?.();
  const onDone = () => dlg.close();
  const onTap = (e: Event) => {
    if (e.target === dlg) dlg.close(); // a tap outside the card closes it
    else stopTimer(); // a tap on the card means someone is reading it
  };
  const onClose = () => {
    if (dlg.open) return; // a close event left over from the pop-up before this one
    cleanup();
    if (!document.querySelector("dialog.ask[open]")) document.documentElement.classList.remove("asking");
    o.onClose?.();
  };
  const cleanup = () => {
    stopTimer();
    q("[data-done]").removeEventListener("click", onDone);
    dlg.removeEventListener("click", onTap);
    dlg.removeEventListener("close", onClose);
    closer = null;
  };
  closer = cleanup;
  q("[data-done]").addEventListener("click", onDone);
  dlg.addEventListener("click", onTap);
  dlg.addEventListener("close", onClose);

  document.documentElement.classList.add("asking");
  if (typeof dlg.showModal === "function") dlg.showModal();
  else dlg.setAttribute("open", "");
  q<HTMLElement>("[data-done]").focus({ preventScroll: true });
}
