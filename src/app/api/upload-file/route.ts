import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as Blob | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const pinataFormData = new FormData();
    pinataFormData.append("file", file, file instanceof File ? file.name : "upload.bin");

    const pinataRes = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      pinataFormData,
      {
        maxBodyLength: Infinity,
        headers: {
          pinata_api_key: process.env.PINATA_API_KEY as string,
          pinata_secret_api_key: process.env.PINATA_SECRET_KEY as string,
        },
      }
    );
   const ipfsHash = pinataRes.data.IpfsHash;
    return NextResponse.json({ipfsHash});
  } catch (error) {
    
    return NextResponse.json({ error: "Upload to Pinata failed." }, { status: 500 });
  }
}