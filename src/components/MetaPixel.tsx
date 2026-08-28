import { useEffect } from "react";

const PIXEL_ID = "2043519676527140";

const MetaPixel = () => {
  useEffect(() => {
    try {
      if (typeof window === "undefined" || typeof document === "undefined") return;
      if (document.getElementById("meta-pixel-script")) return;

      const script = document.createElement("script");
      script.id = "meta-pixel-script";
      script.type = "text/javascript";
      script.async = true;
      script.innerHTML = `
        try {
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${PIXEL_ID}');
          fbq('track', 'PageView');
        } catch (e) {}
      `;
      document.head.appendChild(script);

      const noscript = document.createElement("noscript");
      noscript.id = "meta-pixel-noscript";
      noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1" />`;
      document.head.appendChild(noscript);
    } catch (err) {
      console.warn("Meta Pixel init failed:", err);
    }
  }, []);

  return null;
};

export default MetaPixel;
