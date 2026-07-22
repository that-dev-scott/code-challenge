export function formatDate(isoString: string): string {
  const date = new Date(isoString);

  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = date.getFullYear();

  const hh = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  const timeZone = new Intl.DateTimeFormat("en-US", { timeZoneName: "short" }).formatToParts(date).find((part) => part.type === "timeZoneName")?.value;

  return `${mm}/${dd}/${yyyy} ${hh}:${minutes}${timeZone ? ` ${timeZone}` : ""}`;
}
