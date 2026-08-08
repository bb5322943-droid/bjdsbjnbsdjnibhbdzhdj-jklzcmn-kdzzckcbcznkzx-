import { useState } from "react";
import {
  Building2,
  MapPin,
  Phone,
  Plus,
  UsersRound,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  PageHeader,
  SearchInput,
  StatusBadge,
  StatTile,
  HeroStat,
  RowActions,
  ErrorState,
  ViewToggle,
  type ViewMode,
} from "@/components/PageKit";
import {
  useBranchStats,
  useBranches,
  useDeleteBranch,
} from "@/hooks/use-api";
import { BranchDialog } from "@/components/BranchDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { formatNumber } from "@/lib/format";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Branch } from "@shared/api";

export default function Branches() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("cards");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [deleting, setDeleting] = useState<Branch | null>(null);

  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useBranchStats();
  const { data: branchesData, isLoading: branchesLoading, error: branchesError, refetch: refetchBranches } = useBranches({ search: search || undefined, limit: 50 });
  const deleteBranch = useDeleteBranch();

  // Faqat haqiqiy filiallar (ombor emas)
  const branches = (branchesData?.data ?? []).filter(b => b.note !== "warehouse");
  const statsData = stats?.data;

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteBranch.mutateAsync(deleting.id);
      toast.success("Filial o'chirildi");
      setDeleting(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Xatolik yuz berdi");
    }
  };

  if (statsError || branchesError) {
    return (
      <ErrorState
        message={statsError?.message || branchesError?.message}
        onRetry={() => { refetchStats(); refetchBranches(); }}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Filiallar"
        description="Kompaniya filiallari va joylashuvlarini boshqaring."
      >
        <SearchInput value={search} onChange={setSearch} placeholder="Filial qidirish..." />
        <ViewToggle view={view} onChange={setView} />
        <Button
          onClick={() => { setEditing(null); setDialogOpen(true); }}
          className="bg-[#173f38] hover:bg-[#0f312b]"
        >
          <Plus size={16} className="mr-1.5" />
          Filial qo'shish
        </Button>
      </PageHeader>

      {/* Statistika */}
      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatTile
          value={statsLoading ? "" : formatNumber(statsData?.totalBranches ?? 0)}
          label="Jami filiallar"
          isLoading={statsLoading}
        />
        <StatTile
          value={statsLoading ? "" : formatNumber(statsData?.activeBranches ?? 0)}
          label="Faol filiallar"
          isLoading={statsLoading}
        />
        <StatTile
          value={statsLoading ? "" : formatNumber(statsData?.regions ?? 0)}
          label="Hududlar soni"
          isLoading={statsLoading}
        />
      </section>

      {/* Filiallar ro'yxati */}
      {branchesLoading ? (
        <section className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <article key={i} className="rounded-xl border border-slate-200 bg-white p-5">
              <Skeleton className="h-11 w-11 rounded-xl" />
              <Skeleton className="mt-5 h-6 w-40" />
              <Skeleton className="mt-2 h-4 w-56" />
              <Skeleton className="mt-2 h-4 w-32" />
            </article>
          ))}
        </section>
      ) : branches.length === 0 ? (
        <article className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-12 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-xl bg-white text-slate-300 shadow-sm">
            <Building2 size={24} />
          </span>
          <h3 className="mt-4 text-lg font-bold text-slate-600">
            Filiallar topilmadi
          </h3>
          <p className="mt-1 max-w-xs text-sm text-slate-400">
            {search
              ? "Qidiruv bo'yicha hech narsa topilmadi. Boshqa so'z bilan qidirib ko'ring."
              : "Kompaniyangizga yangi filial qo'shish uchun tugmani bosing."}
          </p>
          {!search && (
            <Button
              onClick={() => { setEditing(null); setDialogOpen(true); }}
              className="mt-4 bg-[#173f38] hover:bg-[#0f312b]"
            >
              <Plus size={16} className="mr-1.5" />
              Filial qo'shish
            </Button>
          )}
        </article>
      ) : view === "cards" ? (
        <section className="grid gap-4 sm:grid-cols-2">
          {branches.map((branch) => (
            <article
              key={branch.id}
              className="group relative rounded-xl border border-slate-200 bg-white p-5 transition hover:shadow-md sm:p-6"
            >
              <div className="flex items-start justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#173f38] text-white">
                  <Building2 size={20} />
                </span>
                <div className="flex items-center gap-2">
                  <StatusBadge
                    label={branch.type === "head_office" ? "Bosh ofis" : "Filial"}
                    tone={branch.type === "head_office" ? "green" : "blue"}
                  />
                  <StatusBadge
                    label={branch.status === "active" ? "Faol" : "Nofaol"}
                    tone={branch.status === "active" ? "green" : "slate"}
                  />
                </div>
              </div>
              <h3 className="mt-5 font-bold text-slate-800">{branch.name}</h3>
              {branch.region && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                  <MapPin size={14} /> {branch.region}
                  {branch.address ? `, ${branch.address}` : ""}
                </p>
              )}
              {branch.phone && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                  <Phone size={14} /> {branch.phone}
                </p>
              )}
              {branch.manager && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                  <UsersRound size={14} /> {branch.manager}
                </p>
              )}

              {/* Amallar */}
              <div className="absolute right-3 top-3 opacity-0 transition group-hover:opacity-100">
                <RowActions
                  onEdit={() => { setEditing(branch); setDialogOpen(true); }}
                  onDelete={() => setDeleting(branch)}
                  editText="Tahrirlash"
                  deleteText="O'chirish"
                />
              </div>
            </article>
          ))}
        </section>
      ) : (
        /* Jadval ko'rinishi */
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="px-4 py-3 font-semibold text-slate-600">Nomi</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Turi</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Hudud</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Telefon</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Mas'ul</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Holat</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((branch) => (
                <tr
                  key={branch.id}
                  className="border-b border-slate-50 transition hover:bg-slate-50/50"
                >
                  <td className="px-4 py-3 font-medium text-slate-800">{branch.name}</td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={branch.type === "head_office" ? "Bosh ofis" : "Filial"}
                      tone={branch.type === "head_office" ? "green" : "blue"}
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-500">{branch.region || "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{branch.phone || "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{branch.manager || "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={branch.status === "active" ? "Faol" : "Nofaol"}
                      tone={branch.status === "active" ? "green" : "slate"}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <RowActions
                      onEdit={() => { setEditing(branch); setDialogOpen(true); }}
                      onDelete={() => setDeleting(branch)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialog'lar */}
      <BranchDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        branch={editing}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => { if (!open) setDeleting(null); }}
        title="Filialni o'chirish"
        description={`${deleting?.name ?? ""} filialini o'chirishni xohlaysizmi? Bu amal qaytarib bo'lmaydi.`}
        confirmText="O'chirish"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  );
}
