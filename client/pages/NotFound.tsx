import { ArrowLeft, Compass } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const location = useLocation();

  return (
    <>
      <div className="grid min-h-[60vh] place-items-center">
        <div className="max-w-md text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#e8f1ee] text-[#2c8069]">
            <Compass size={26} />
          </span>
          <p className="mt-6 text-5xl font-bold tracking-tight text-slate-900">
            404
          </p>
          <h2 className="mt-3 text-lg font-bold text-slate-800">
            Sahifa topilmadi
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
              {location.pathname}
            </code>{" "}
            manzili mavjud emas yoki ko'chirilgan.
          </p>
          <Button asChild className="mt-6 bg-[#173f38] hover:bg-[#0f312b]">
            <Link to="/">
              <ArrowLeft size={16} /> Boshqaruv paneliga qaytish
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
}
