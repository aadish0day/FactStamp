import html2canvas from "html2canvas";

export async function generateCard(claimId) {
  const el = document.getElementById(`fcc-${claimId}`);
  if (!el) return;
  const canvas = await html2canvas(el, {
    scale: 2,
    width: 540,
    height: 540,
    backgroundColor: "#080810",
    logging: false,
  });
  const link = document.createElement("a");
  link.download = `whisperstop-factcheck-${claimId}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
