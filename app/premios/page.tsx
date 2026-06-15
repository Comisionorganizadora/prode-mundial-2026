import Image from "next/image";
import Navbar from "@/components/Navbar";

export default function PremiosPage() {
  return (
    <>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-4 border-b-4 border-yellow-500">
            <h1 className="text-2xl font-bold">
              🎁 Premios y Fondo de Participación
            </h1>

            <p className="text-sm text-gray-300 mt-1">
              Prode Mundial 2026
            </p>
          </div>

          <div className="p-4">
            <Image
              src="/Premios.jpeg"
              alt="Premios Mundial 2026"
              width={1200}
              height={1600}
              className="w-full h-auto rounded-lg"
              priority
            />
          </div>
        </div>
      </main>
    </>
  );
}