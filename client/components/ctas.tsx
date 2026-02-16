import Link from "next/link";

export default function SimpleCTA() {
  return (
    <section className="relative w-full overflow-hidden bg-[#0b4f8a] py-12">

      {/* Geometry Background */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(135deg, #ffffff15 25%, transparent 25%), linear-gradient(225deg, #ffffff15 25%, transparent 25%), linear-gradient(45deg, #ffffff15 25%, transparent 25%), linear-gradient(315deg, #ffffff15 25%, transparent 25%)",
          backgroundPosition: "20px 0, 20px 0, 0 0, 0 0",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">

        {/* LEFT */}
        <h2 className="text-white text-2xl md:text-3xl font-semibold max-w-2xl">
          Discover Premium Home & Healthcare Textiles
          <br />
          <span className="text-white/80 font-normal">
            Manufactured by TC Krupa Fabrics under Country Home
          </span>
        </h2>

        {/* RIGHT */}
        <div className="flex items-center gap-6 flex-wrap">

          <div className="text-white text-sm">
            Ready to place bulk order?<br />
            <span className="font-semibold text-lg">+91 8826 916 476</span>
          </div>

          <Link
            href="/contact"
            className="bg-[#ffc847] hover:bg-[#ffb800] text-black px-6 py-3 rounded-full font-medium transition"
          >
            Request Catalogue →
          </Link>

        </div>

      </div>

    </section>
  );
}
