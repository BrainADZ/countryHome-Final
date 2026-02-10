"use client";

export default function AboutInfoSection() {
  return (
    <section className="w-full bg-[#f9fafb] text-gray-700 py-12 border-t border-[#e2e4ea]">
      <div className="max-w-[1700px] mx-auto px-4 space-y-10 text-[14px] leading-relaxed">

        {/* About */}
        <div>
          <h2 className="text-[18px] font-semibold text-[#003366] mb-2">
            About Country Home (TC Krupa Fabrics)
          </h2>

          <p>
            TC Krupa Fabrics, established in 2009, is a leading manufacturer, wholesaler, and supplier of
            premium home furnishing and textile products. Founded by Mr. Rahul Agarwal, the company is
            backed by over 20 years of hands-on experience in textile product development.
          </p>

          <p className="mt-2">
            Operating under our own brand “Country Home”, we deliver end-to-end textile solutions across
            domestic retail, trade, e-commerce, private labeling, and corporate gifting. Our focus is on
            quality manufacturing, functional design, and customer-specific customization.
          </p>
        </div>

        {/* Verticals */}
        <div>
          <h3 className="text-[16px] font-semibold text-[#003366] mb-2">
            Our Business Verticals
          </h3>

          <ul className="list-disc list-inside space-y-1">
            <li>Domestic & Trade Supply</li>
            <li>E-Commerce Manufacturing Support</li>
            <li>Private Label Development</li>
            <li>Corporate & Institutional Gifting</li>
            <li>Medical & Clinic Textile Solutions</li>
          </ul>
        </div>

        {/* Products */}
        <div>
          <h3 className="text-[16px] font-semibold text-[#003366] mb-2">
            Our Product Range
          </h3>

          <p>
            Country Home offers a wide portfolio of soft furnishing and healthcare textile products,
            designed for comfort, durability, and hygiene.
          </p>

          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Digital Printed Pillows & Cushion Covers</li>
            <li>Dohar Collections (100% Cotton Cambric)</li>
            <li>Hospital Linen & Examination Bedsheets</li>
            <li>Towel Collections (Face, Hand & Bath Towels – 400 GSM)</li>
            <li>King Size Bedsheet Sets & Fitted Sheets</li>
            <li>Kids Learning Cushion Pillow Books</li>
            <li>In-Clinic Textile Kits & Medical Curtains</li>
            <li>Surgical Gowns, Caps & Hygiene Accessories</li>
          </ul>
        </div>

        {/* Quality */}
        <div>
          <h3 className="text-[16px] font-semibold text-[#003366] mb-2">
            Quality & Innovation
          </h3>

          <p>
            Our products are crafted using skin-friendly fabrics, soft finishes, and long-lasting dyes.
            We specialize in antibacterial, anti-fungal, anti-allergic, and reusable hygiene textile
            solutions tailored for homes, clinics, and hospitals.
          </p>

          <p className="mt-2">
            Every product is developed with attention to comfort, absorbency, durability, and aesthetic
            appeal — available in multiple patterns, shades, and custom specifications.
          </p>
        </div>

        {/* Why Choose */}
        <div>
          <h3 className="text-[16px] font-semibold text-[#003366] mb-2">
            Why Choose Country Home?
          </h3>

          <ul className="list-disc list-inside space-y-1">
            <li>15+ years of textile manufacturing expertise</li>
            <li>Own brand plus private labeling capability</li>
            <li>Customized production as per client requirements</li>
            <li>Medical-grade hygiene textile solutions</li>
            <li>Reliable bulk supply & consistent quality standards</li>
          </ul>
        </div>

        {/* Closing */}
        <div className="pt-6 border-t border-[#e3e5eb] text-[13px] text-gray-600">
          <p>
            Country Home by TC Krupa Fabrics is your trusted manufacturing partner for home furnishings
            and healthcare textiles — blending comfort, functionality, and quality in every product.
            We look forward to serving you better.
          </p>
        </div>

      </div>
    </section>
  );
}
