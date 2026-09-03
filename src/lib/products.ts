import ultra3Img from "@/assets/ultra3-watch.png";
import airpodsImg from "@/assets/airpods-pro-2.png";
import kts1185Img from "@/assets/kts-1185-speaker.png";
import powerbankImg from "@/assets/powerbank.png";
import akgImg from "@/assets/akg-handsfree.png";
import solarSpeakerImg from "@/assets/solar-speaker.png";
import portableAcImg from "@/assets/portable-ac-fan.png";
import powerbank10kImg from "@/assets/powerbank-10000.png";
import powerbank20kImg from "@/assets/powerbank-20000-transparent.png";
import p9HeadphonesImg from "@/assets/p9-headphones.png";

export type Product = {
  slug: string;
  name: string;
  tagline: string;
  price: string;
  oldPrice?: string;
  img: string;
  tag?: string;
  category: string;
  description: string;
  features: string[];
  images?: string[];
  colors?: string[];
  sections?: string[];
  discountPercent?: number;
  categorySlug?: string;
  viewsCount?: number;
};


// Fallback images for the seeded products (used when image_url is null in DB)
export const fallbackImageBySlug: Record<string, string> = {
  "ultra-3-smartwatch": ultra3Img,
  "airpods-pro-2-black": airpodsImg,
  "kts-1185-speaker": kts1185Img,
  "super-charger-powerbank": powerbankImg,
  "akg-handsfree": akgImg,
  "kts-1706-solar-speaker": solarSpeakerImg,
  "portable-ac-cooling-fan": portableAcImg,
  "10000mah-slim-power-bank": powerbank10kImg,
  "20000mah-transparent-power-bank": powerbank20kImg,
  "p9-wireless-headphones": p9HeadphonesImg,
};

export const placeholderImg = ultra3Img;

export const products: Product[] = [
  {
    slug: "ultra-3-smartwatch",
    name: "Ultra 3 Smartwatch",
    tagline: "Pakistan's Most Versatile 7-Strap Luxury Watch",
    price: "Rs. 4,500",
    oldPrice: "Rs. 12,000",
    img: ultra3Img,
    tag: "7-in-1 Edition",
    category: "Smart Watch",
    description:
      "The ultimate smartwatch package for DesiCart customers. Featuring a stunning Super AMOLED display and 7 different interchangeable straps to match every outfit.",
    features: [
      "Big Full HD Infinite Display",
      "7 Premium Straps Included in Box",
      "Wireless Fast Charging",
      "Bluetooth Calling & Heart Rate Monitoring",
      "Sports Mode & Calculator Built-in",
    ],
  },
  {
    slug: "airpods-pro-2-black",
    name: "Airpods Pro 2 Black",
    tagline: "Master Copy | ANC & Deep Bass",
    price: "Rs. 1,500",
    oldPrice: "Rs. 3,500",
    img: airpodsImg,
    tag: "Best Seller",
    category: "Earbuds",
    description:
      "Experience premium sound with the sleek Airpods Pro 2 in a stunning matte black finish. Designed for comfort and high-quality audio, these are the perfect daily drivers for music and calls.",
    features: [
      "Active Noise Cancellation (ANC) support",
      "Superior Bass & Crisp Treble",
      "3-4 Hours Playback Time",
      "Touch Controls for Music & Calls",
      "Wireless Charging Case",
    ],
  },
  {
    slug: "kts-1185-speaker",
    name: "KTS-1185 Wireless Speaker",
    tagline: "3-Inch Drive | Built-in Emergency Torch",
    price: "Rs. 1,800",
    oldPrice: "Rs. 3,500",
    img: kts1185Img,
    tag: "New",
    category: "Speakers",
    description:
      "A portable powerhouse for music lovers. This wireless speaker features a 3-inch high-bass driver and a built-in emergency light, making it the perfect outdoor companion.",
    features: [
      "3\" Powerful Audio Drive",
      "Built-in High-Power Emergency Light",
      "FM Radio & USB/TF Card Support",
      "Wireless Bluetooth Connectivity",
      "Rugged, Portable Design with Handle",
    ],
  },
  {
    slug: "super-charger-powerbank",
    name: "Super Charger Power Bank",
    tagline: "LED Digital Display | PD Fast Charging",
    price: "Rs. 2,999",
    oldPrice: "Rs. 6,000",
    img: powerbankImg,
    tag: "Limited",
    category: "Accessories",
    description:
      "Never run out of juice again. This intelligent super-fast charging power bank features a digital percentage display and PD Type-C input/output.",
    features: [
      "Intelligent Super Fast Charging",
      "LED Digital Battery Percentage Display",
      "Type-C PD 20W Output",
      "Travel-Friendly Design (Check-in OK)",
      "Multiple Device Protection Circuit",
    ],
  },
  {
    slug: "akg-handsfree",
    name: "AKG Type-C Handsfree",
    tagline: "Best Sound and Bass | Samsung Optimized",
    price: "Rs. 600",
    oldPrice: "Rs. 1,200",
    img: akgImg,
    category: "Headphones",
    description:
      "Original-quality AKG tuned earphones featuring deep bass and crystal clear audio. Available in both Type-C and 3.5mm jack versions to fit any smartphone.",
    features: [
      "Tuned by AKG for Studio Quality Sound",
      "Tangle-free Fabric Cable",
      "In-line Mic with Volume Control",
      "Extra Bass Boost Technology",
      "Ergonomic In-ear Design",
    ],
  },
  {
    slug: "kts-1706-solar-speaker",
    name: "KTS-1706 Solar Speaker",
    tagline: "4-Inch Drive | Solar Powered Music",
    price: "Rs. 2,500",
    oldPrice: "Rs. 4,500",
    img: solarSpeakerImg,
    tag: "Outdoor",
    category: "Speakers",
    description:
      "A rugged outdoor speaker that never stops playing. With a built-in solar panel, you can charge it under the sun while enjoying your favorite hits with the massive 4-inch driver.",
    features: [
      "Built-in Solar Charging Panel",
      "Large 4\" High-Output Driver",
      "High-Power LED Flashlight",
      "Bluetooth, USB, and SD Card Support",
      "Long-lasting Rechargeable Battery",
    ],
  },
  {
    slug: "portable-ac-cooling-fan",
    name: "Portable AC Cooling Fan",
    tagline: "3-in-1 Mini AC | Humidifier | Cooling Fan",
    price: "Rs. 1,999",
    oldPrice: "Rs. 4,000",
    img: portableAcImg,
    tag: "Summer Hit",
    category: "Home Appliance",
    description:
      "Beat the summer heat with this compact 3-in-1 portable air conditioner. Combines a powerful cooling fan, water-mist humidifier, and ambient night light — perfect for desks, bedrooms and small rooms.",
    features: [
      "3-in-1: Cooler, Humidifier & Fan",
      "5 Mist Spray Outlets for Instant Cooling",
      "3 Adjustable Fan Speeds",
      "USB Powered — Use Anywhere",
      "Built-in 7-Color Night Light",
    ],
  },
  {
    slug: "10000mah-slim-power-bank",
    name: "10000mAh Slim Power Bank",
    tagline: "PD 22.5W Fast Charging | Ultra Slim Design",
    price: "Rs. 1,999",
    oldPrice: "Rs. 3,500",
    img: powerbank10kImg,
    tag: "Trending",
    category: "Accessories",
    description:
      "An ultra-slim 10000mAh portable charger with PD 22.5W fast charging support. Pocket-friendly size with enough power to top up your phone 2–3 times on a single charge.",
    features: [
      "10000mAh High-Density Battery",
      "PD 22.5W Super Fast Charging",
      "Slim & Lightweight Pocket Design",
      "Type-C & USB-A Output Ports",
      "Multi-Layer Safety Protection",
    ],
  },
  {
    slug: "20000mah-transparent-power-bank",
    name: "20000mAh Transparent Power Bank",
    tagline: "66W PD Super Fast Charging | Cyberpunk Look",
    price: "Rs. 3,499",
    oldPrice: "Rs. 6,500",
    img: powerbank20kImg,
    tag: "Premium",
    category: "Accessories",
    description:
      "A massive 20000mAh power bank with a stunning transparent body that shows off the internal circuitry. Features 66W PD super fast charging and a clear digital display — perfect for tech lovers.",
    features: [
      "20000mAh Long-lasting Capacity",
      "66W PD Super Fast Charging Output",
      "Transparent Cyberpunk Body Design",
      "LED Display: Voltage, Current & %",
      "Charges Phones, Tablets & Laptops",
    ],
  },
  {
    slug: "p9-wireless-headphones",
    name: "P9 Wireless Bluetooth Headphones",
    tagline: "Noise Cancelling | Mic | 5 Color Options",
    price: "Rs. 1,499",
    oldPrice: "Rs. 3,000",
    img: p9HeadphonesImg,
    tag: "Best Seller",
    category: "Headphones",
    description:
      "Premium P9 over-ear wireless headphones with active noise cancellation and built-in mic. Soft cushion ear-cups for all-day comfort, available in 5 trendy colors.",
    features: [
      "Active Noise Cancelling (ANC)",
      "Built-in HD Mic for Calls",
      "Bluetooth 5.3 Wireless Connectivity",
      "Soft Memory-Foam Ear Cushions",
      "Available in 5 Stylish Colors",
    ],
  },
];

export const WHATSAPP_NUMBER = "923214028277"; // 0321-4028277

export function waLinkFor(productName: string) {
  const text = `Hi! I want to order the ${productName} from DesiCart.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}
