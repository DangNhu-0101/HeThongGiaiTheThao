import badmintonImage from "@/assets/badminton.png";
import basketballImage from "@/assets/basketball.png";
import pickleballImage from "@/assets/pickeball.png";
import soccerImage from "@/assets/soccer.png";
import tennisImage from "@/assets/tennis.png";
import volleyballImage from "@/assets/volleyball.png";

const normalize = (value: unknown) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const sportImages: Record<string, string> = {
  pickleball: pickleballImage,
  "bong-da": soccerImage,
  soccer: soccerImage,
  "bong-chuyen": volleyballImage,
  volleyball: volleyballImage,
  "bong-ro": basketballImage,
  basketball: basketballImage,
  "cau-long": badmintonImage,
  badminton: badmintonImage,
  tennis: tennisImage,
};

export const getSportImage = (...values: unknown[]) => {
  for (const value of values) {
    const key = normalize(value);
    if (key && sportImages[key]) return sportImages[key];
  }
  return pickleballImage;
};

export const getSportAssetKey = normalize;
