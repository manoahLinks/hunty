import { NextRequest, NextResponse } from "next/server"

const PINATA_JWT = process.env.PINATA_JWT

export async function POST(req: NextRequest) {
  if (!PINATA_JWT) {
    return NextResponse.json(
      { error: "IPFS uploads are not configured. Add PINATA_JWT to your environment variables." },
      { status: 503 }
    )
  }

  const formData = await req.formData()
  const file = formData.get("file")

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  // Forward to Pinata's pinFileToIPFS endpoint
  const pinataForm = new FormData()
  pinataForm.append("file", file)

  const pinataRes = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: pinataForm,
  })

  if (!pinataRes.ok) {
    const errText = await pinataRes.text()
    console.error("Pinata upload error:", pinataRes.status, errText)
    return NextResponse.json({ error: "Failed to pin file to IPFS" }, { status: 502 })
  }

  const data = await pinataRes.json() as { IpfsHash: string }
  return NextResponse.json({ cid: data.IpfsHash })
}
