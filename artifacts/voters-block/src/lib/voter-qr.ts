import QRCode from "qrcode";
import { isValidPublicId, publicVotingUrl, type Poll } from "@/lib/backend-api";

export async function downloadVoterQr(poll: Poll): Promise<void> {
  if (!poll.active) throw new Error("This poll is closed.");
  if (!poll.publicId || !isValidPublicId(poll.publicId)) {
    throw new Error("This poll has no valid public ID.");
  }

  const dataUrl = await QRCode.toDataURL(publicVotingUrl(poll.publicId), {
    width: 1024,
    margin: 2,
    errorCorrectionLevel: "H",
  });
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = `voters-block-poll-${poll.id}.png`;
  anchor.click();
}