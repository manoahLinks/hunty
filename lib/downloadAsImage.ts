import html2canvas from "html2canvas"

export type DownloadAsImageOptions = {
  filename?: string
  backgroundColor?: string
}

export async function downloadElementAsImage(
  element: HTMLElement,
  options: DownloadAsImageOptions = {},
): Promise<void> {
  const canvas = await html2canvas(element, {
    useCORS: true,
    scale: 2,
    backgroundColor: options.backgroundColor ?? "#ffffff",
  })

  const link = document.createElement("a")
  link.href = canvas.toDataURL("image/png")
  link.download = options.filename ?? "hunty-card.png"
  link.click()
}
