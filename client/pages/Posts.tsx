import { useState } from "react";
import {
  Calendar,
  Edit3,
  Eye,
  FileText,
  Heart,
  Image,
  MessageCircle,
  Plus,
  Tag,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Post, PostCategory, PostStatus } from "@shared/api";
import {
  CardGrid,
  Column,
  DataTable,
  TablePagination,
} from "@/components/DataTable";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DetailDialog } from "@/components/DetailDialog";
import {
  ErrorState,
  HeroStat,
  PageHeader,
  RowActions,
  SearchInput,
  StatTile,
  StatusBadge,
  ViewButton,
  ViewMode,
  ViewToggle,
} from "@/components/PageKit";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatTimeAgo, formatNumber } from "@/lib/format";

const ALL = "__all__";

// Mock data
const mockPosts: Post[] = [
  {
    id: "1",
    title: "Yangi mahsulot liniyasi e'lon qilindi",
    content: "Bizning kompaniyamiz yangi mahsulot liniyasini e'lon qilmoqda. Bu mahsulotlar zamonaviy texnologiyalar asosida ishlab chiqarilgan...",
    excerpt: "Yangi mahsulot liniyasi haqida qisqacha ma'lumot",
    imageUrl: "https://via.placeholder.com/400x250",
    authorId: "user1",
    authorName: "Akmal Karimov",
    category: "news",
    status: "published",
    tags: ["mahsulot", "yangilik", "texnologiya"],
    viewCount: 245,
    likesCount: 18,
    createdDate: "2024-12-01T09:00:00Z",
    updatedDate: "2024-12-01T09:00:00Z",
    publishedDate: "2024-12-01T09:00:00Z",
  },
  {
    id: "2",
    title: "Kompaniya yig'ilishi e'loni",
    content: "Barcha xodimlar uchun muhim kompaniya yig'ilishi 15-dekabr kuni o'tkaziladi...",
    excerpt: "Kompaniya yig'ilishi haqida e'lon",
    authorId: "user2",
    authorName: "Dilnoza Rahimova",
    category: "announcement",
    status: "published",
    tags: ["yig'ilish", "e'lon"],
    viewCount: 156,
    likesCount: 12,
    createdDate: "2024-11-30T14:30:00Z",
    updatedDate: "2024-11-30T14:30:00Z",
    publishedDate: "2024-11-30T14:30:00Z",
  },
  {
    id: "3",
    title: "Tizim yangilanishi haqida",
    content: "ERP tizimimiz yangi funksiyalar bilan yangilandi. Ushbu yangilanish...",
    excerpt: "Tizim yangilanishi va yangi funksiyalar",
    authorId: "user1", 
    authorName: "Akmal Karimov",
    category: "update",
    status: "draft",
    tags: ["tizim", "yangilanish"],
    viewCount: 89,
    likesCount: 7,
    createdDate: "2024-11-29T11:15:00Z",
    updatedDate: "2024-11-29T16:20:00Z",
    publishedDate: undefined,
  },
];

export default function Posts() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>(ALL);
  const [status, setStatus] = useState<string>(ALL);
  const [page, setPage] = useState(1);

  const [view, setView] = useState<ViewMode>("table");
  const [createOpen, setCreateOpen] = useState(false);
  const [viewing, setViewing] = useState<Post | null>(null);
  const [editing, setEditing] = useState<Post | null>(null);
  const [deleting, setDeleting] = useState<Post | null>(null);

  // Mock states
  const isLoading = false;
  const isError = false;
  const error = null;

  const mockStats = {
    totalPosts: 156,
    publishedPosts: 142,
    draftPosts: 14,
    totalViews: 12450,
    totalLikes: 892,
    popularPosts: [
      { id: "1", title: "Yangi mahsulot liniyasi", viewCount: 245, category: "news" as PostCategory },
      { id: "2", title: "Kompaniya yig'ilishi", viewCount: 156, category: "announcement" as PostCategory },
    ],
    recentPosts: mockPosts.slice(0, 3),
  };

  // Filter posts
  const filteredPosts = mockPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(search.toLowerCase()) ||
                         post.content.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === ALL || post.category === category;
    const matchesStatus = status === ALL || post.status === status;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const withPageReset =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(1);
    };

  const handleDelete = async () => {
    if (!deleting) return;
    toast.success(`${deleting.title} o'chirildi`);
    setDeleting(null);
  };

  const getCategoryLabel = (cat: PostCategory) => {
    switch (cat) {
      case "news": return "Yangilik";
      case "announcement": return "E'lon";
      case "blog": return "Blog";
      case "update": return "Yangilanish";
      case "event": return "Tadbir";
      default: return cat;
    }
  };

  const getCategoryColor = (cat: PostCategory) => {
    switch (cat) {
      case "news": return "bg-blue-100 text-blue-800";
      case "announcement": return "bg-yellow-100 text-yellow-800";
      case "blog": return "bg-green-100 text-green-800";
      case "update": return "bg-purple-100 text-purple-800";
      case "event": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadge = (post: Post) => {
    switch (post.status) {
      case "published":
        return <StatusBadge label="Chop etilgan" tone="green" />;
      case "draft":
        return <StatusBadge label="Qoralama" tone="amber" />;
      case "archived":
        return <StatusBadge label="Arxivlangan" tone="gray" />;
      default:
        return <StatusBadge label="Noma'lum" tone="gray" />;
    }
  };

  const columns: Column<Post>[] = [
    {
      header: "Sarlavha",
      cell: (post) => (
        <div className="min-w-0 max-w-md">
          <p className="truncate text-sm font-medium text-slate-900">
            {post.title}
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {post.excerpt || "Tavsif yo'q"}
          </p>
          <div className="mt-1 flex items-center gap-1">
            <Badge className={`text-xs ${getCategoryColor(post.category)}`}>
              {getCategoryLabel(post.category)}
            </Badge>
          </div>
        </div>
      ),
    },
    {
      header: "Muallif",
      className: "hidden lg:table-cell",
      cell: (post) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
            <User size={14} className="text-slate-500" />
          </div>
          <span className="text-sm text-slate-700">{post.authorName}</span>
        </div>
      ),
    },
    {
      header: "Ko'rishlar",
      align: "right",
      className: "hidden md:table-cell",
      cell: (post) => (
        <div className="text-right">
          <div className="flex items-center justify-end gap-1 text-sm text-slate-600">
            <Eye size={14} />
            <span>{formatNumber(post.viewCount)}</span>
          </div>
          <div className="flex items-center justify-end gap-1 text-sm text-slate-500 mt-0.5">
            <Heart size={12} />
            <span>{formatNumber(post.likesCount)}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Sana",
      className: "hidden xl:table-cell", 
      cell: (post) => (
        <div className="text-sm text-slate-600">
          <p>{formatDate(post.createdDate)}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {formatTimeAgo(post.updatedDate)}
          </p>
        </div>
      ),
    },
    {
      header: "Holat",
      className: "hidden sm:table-cell",
      cell: (post) => getStatusBadge(post),
    },
    {
      header: "",
      align: "right",
      cell: (post) => (
        <RowActions
          onView={() => setViewing(post)}
          onEdit={() => setEditing(post)}
          onDelete={() => setDeleting(post)}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Postlar"
        description="Kompaniya yangiliklari, e'lonlar va blog postlari."
      >
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-[#173f38] hover:bg-[#0f312b]"
        >
          <Plus size={16} /> Yangi post
        </Button>
      </PageHeader>

      <section className="grid gap-4 md:grid-cols-4">
        <HeroStat
          icon={FileText}
          value={formatNumber(mockStats.totalPosts)}
          label="Jami postlar"
          isLoading={false}
        />
        <StatTile
          value={formatNumber(mockStats.publishedPosts)}
          label="Chop etilgan"
          isLoading={false}
        />
        <StatTile
          value={formatNumber(mockStats.draftPosts)}
          label="Qoralamalar"
          tone="warning"
          isLoading={false}
        />
        <StatTile
          value={formatNumber(mockStats.totalViews)}
          label="Jami ko'rishlar"
          isLoading={false}
        />
      </section>

      {/* Popular Posts */}
      <section className="mt-6">
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <h3 className="font-bold text-slate-800">Mashhur postlar</h3>
            <p className="mt-1 text-sm text-slate-400">
              Eng ko'p ko'rilgan postlar
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {mockStats.popularPosts.map((post, index) => (
              <div key={post.id} className="flex items-center gap-3 px-5 py-3.5 sm:px-6">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#e9f5ef] text-sm font-bold text-[#378166]">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-700">
                    {post.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {getCategoryLabel(post.category)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="flex items-center gap-1 text-sm font-bold text-slate-900">
                    <Eye size={14} />
                    <span>{formatNumber(post.viewCount)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center">
          <div>
            <h3 className="font-bold text-slate-800">Barcha postlar</h3>
            <p className="mt-1 text-sm text-slate-400">
              {filteredPosts.length} ta post topildi
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SearchInput
              value={search}
              onChange={withPageReset(setSearch)}
              placeholder="Sarlavha yoki mazmun bo'yicha qidirish..."
            />
            <Select value={category} onValueChange={withPageReset(setCategory)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Barcha kategoriya</SelectItem>
                <SelectItem value="news">Yangilik</SelectItem>
                <SelectItem value="announcement">E'lon</SelectItem>
                <SelectItem value="blog">Blog</SelectItem>
                <SelectItem value="update">Yangilanish</SelectItem>
                <SelectItem value="event">Tadbir</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={withPageReset(setStatus)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Barcha holat</SelectItem>
                <SelectItem value="published">Chop etilgan</SelectItem>
                <SelectItem value="draft">Qoralama</SelectItem>
                <SelectItem value="archived">Arxivlangan</SelectItem>
              </SelectContent>
            </Select>
            <ViewToggle view={view} onChange={setView} />
          </div>
        </div>

        {isError ? (
          <ErrorState message={error?.message} onRetry={() => {}} />
        ) : (
          <>
            {view === "table" ? (
              <DataTable
                columns={columns}
                rows={filteredPosts}
                rowKey={(post) => post.id}
                isLoading={isLoading}
                emptyText="Post topilmadi."
                minWidth={900}
              />
            ) : (
              <CardGrid
                rows={filteredPosts}
                rowKey={(post) => post.id}
                isLoading={isLoading}
                emptyText="Post topilmadi."
                renderCard={(post) => (
                  <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white overflow-hidden hover:shadow-md transition-shadow">
                    {/* Image */}
                    {post.imageUrl && (
                      <div className="aspect-video bg-slate-100 flex items-center justify-center">
                        <Image size={24} className="text-slate-400" />
                      </div>
                    )}
                    
                    {/* Content */}
                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <Badge className={`text-xs ${getCategoryColor(post.category)}`}>
                          {getCategoryLabel(post.category)}
                        </Badge>
                        <div className="flex shrink-0 items-center">
                          <ViewButton onClick={() => setViewing(post)} />
                          <RowActions
                            onView={() => setViewing(post)}
                            onEdit={() => setEditing(post)}
                            onDelete={() => setDeleting(post)}
                          />
                        </div>
                      </div>

                      <h3 className="font-bold text-slate-900 mb-2 line-clamp-2">
                        {post.title}
                      </h3>
                      
                      <p className="text-sm text-slate-600 mb-3 line-clamp-3">
                        {post.excerpt || post.content.slice(0, 150) + "..."}
                      </p>

                      {/* Meta */}
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                        <div className="flex items-center gap-1">
                          <User size={12} />
                          <span>{post.authorName}</span>
                        </div>
                        <span>{formatTimeAgo(post.createdDate)}</span>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between">
                        {getStatusBadge(post)}
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <Eye size={12} />
                            <span>{formatNumber(post.viewCount)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart size={12} />
                            <span>{formatNumber(post.likesCount)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              />
            )}
          </>
        )}
      </section>

      {/* Post Detail Dialog */}
      <DetailDialog
        open={Boolean(viewing)}
        onOpenChange={(open) => !open && setViewing(null)}
        title={viewing?.title ?? ""}
        subtitle={`${viewing?.authorName} • ${
          viewing ? formatDate(viewing.createdDate) : ""
        }`}
        badges={viewing && getStatusBadge(viewing)}
        sections={
          viewing
            ? [
                {
                  title: "Post ma'lumotlari",
                  fields: [
                    {
                      label: "Kategoriya",
                      value: viewing.category ? getCategoryLabel(viewing.category) : "—",
                    },
                    {
                      label: "Holat",
                      value: viewing.status === "published" ? "Chop etilgan" : 
                             viewing.status === "draft" ? "Qoralama" : "Arxivlangan",
                    },
                    {
                      label: "Ko'rishlar",
                      value: formatNumber(viewing.viewCount),
                    },
                    {
                      label: "Yoqtirish",
                      value: formatNumber(viewing.likesCount),
                    },
                  ],
                },
                {
                  title: "Mazmun",
                  fields: [
                    {
                      label: "Qisqacha",
                      value: viewing.excerpt || "Qisqacha tavsif yo'q",
                    },
                    {
                      label: "To'liq matn",
                      value: (
                        <div className="max-h-32 overflow-y-auto text-sm">
                          {viewing.content}
                        </div>
                      ),
                    },
                  ],
                },
                {
                  title: "Vaqt ma'lumotlari",
                  fields: [
                    {
                      label: "Yaratilgan",
                      value: formatDate(viewing.createdDate),
                    },
                    {
                      label: "Yangilangan",
                      value: formatDate(viewing.updatedDate),
                    },
                    {
                      label: "Chop etilgan",
                      value: viewing.publishedDate ? formatDate(viewing.publishedDate) : "—",
                    },
                  ],
                },
              ]
            : []
        }
        actions={
          viewing && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const post = viewing;
                  setViewing(null);
                  setEditing(post);
                }}
              >
                <Edit3 size={16} /> Tahrirlash
              </Button>
            </div>
          )
        }
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Postni o'chirish"
        description={
          deleting && (
            <>
              <b>{deleting.title}</b> postini o'chirishni tasdiqlaysizmi?
              Bu amalni bekor qilib bo'lmaydi.
            </>
          )
        }
        confirmText="O'chirish"
        destructive
        onConfirm={handleDelete}
      />

      {/* TODO: Post Create/Edit Dialog */}
      {/* PostDialog component qo'shish kerak */}
    </>
  );
}