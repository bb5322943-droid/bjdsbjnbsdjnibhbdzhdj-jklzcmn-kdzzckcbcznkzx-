import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Clock, Lock } from "lucide-react";
import { toast } from "sonner";
import { Employee, AttendanceRecord } from "@shared/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMarkAttendance, useAttendance } from "@/hooks/use-api";
import { todayISO, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  employees: Employee[];
}

interface AttendanceEntry {
  employeeId: string;
  checkIn: string;
  checkOut: string;
  isPresent: boolean | null; // null = hali belgilanmagan, true = kelgan, false = kelmagan
  isLocked: boolean; // Bugun allaqachon kiritilgan
  existingRecord?: AttendanceRecord;
}

export function QuickAttendance({ employees }: Props) {
  const [entries, setEntries] = useState<Record<string, AttendanceEntry>>(() => {
    const initial: Record<string, AttendanceEntry> = {};
    employees.forEach(emp => {
      initial[emp.id] = {
        employeeId: emp.id,
        checkIn: "",
        checkOut: "",
        isPresent: null,
        isLocked: false,
      };
    });
    return initial;
  });

  const markAttendance = useMarkAttendance();
  
  // Bugungi davomatlarni tekshirish
  const { data: todayAttendanceData } = useAttendance({
    date: todayISO(),
    limit: 100,
  });

  // Bugungi davomatlar yuklanganida, kiritilgan xodimlarni bloklash
  useEffect(() => {
    if (todayAttendanceData?.data) {
      const todayRecords = todayAttendanceData.data;
      setEntries(prev => {
        const updated = { ...prev };
        todayRecords.forEach(record => {
          if (updated[record.employeeId]) {
            updated[record.employeeId] = {
              ...updated[record.employeeId],
              isLocked: true,
              isPresent: record.status !== "absent",
              checkIn: record.checkIn || "",
              checkOut: record.checkOut || "",
              existingRecord: record,
            };
          }
        });
        return updated;
      });
    }
  }, [todayAttendanceData]);

  const handlePresent = (employeeId: string) => {
    if (entries[employeeId].isLocked) {
      toast.error("Bu xodim uchun bugun davomat allaqachon kiritilgan");
      return;
    }
    
    setEntries(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        isPresent: true,
        checkIn: prev[employeeId].checkIn || getCurrentTime(),
      }
    }));
  };

  const handleAbsent = (employeeId: string) => {
    if (entries[employeeId].isLocked) {
      toast.error("Bu xodim uchun bugun davomat allaqachon kiritilgan");
      return;
    }
    
    setEntries(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        isPresent: false,
        checkIn: "",
        checkOut: "",
      }
    }));
  };

  const handleCheckInChange = (employeeId: string, value: string) => {
    if (entries[employeeId].isLocked) return;
    
    setEntries(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        checkIn: value,
      }
    }));
  };

  const handleCheckOutChange = (employeeId: string, value: string) => {
    if (entries[employeeId].isLocked) return;
    
    setEntries(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        checkOut: value,
      }
    }));
  };

  const handleSaveAll = async () => {
    const toSave = Object.values(entries).filter(
      entry => entry.isPresent !== null && !entry.isLocked
    );
    
    if (toSave.length === 0) {
      toast.error("Yangi davomat belgilanmagan yoki barcha xodimlar uchun davomat allaqachon kiritilgan");
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    const savedEmployeeIds: string[] = [];

    for (const entry of toSave) {
      try {
        const result = await markAttendance.mutateAsync({
          employeeId: entry.employeeId,
          status: entry.isPresent ? "present" : "absent",
          date: todayISO(),
          checkIn: entry.isPresent ? entry.checkIn : undefined,
          checkOut: entry.isPresent ? entry.checkOut : undefined,
          note: "",
        });
        successCount++;
        savedEmployeeIds.push(entry.employeeId);
      } catch (error) {
        errorCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} ta xodim davomati saqlandi`);
      
      // Saqlanganlarni bloklaymiz
      setEntries(prev => {
        const updated = { ...prev };
        savedEmployeeIds.forEach(employeeId => {
          updated[employeeId] = {
            ...updated[employeeId],
            isLocked: true,
          };
        });
        return updated;
      });
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} ta xatolik yuz berdi`);
    }
  };

  const getCurrentTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  const unlockedCount = Object.values(entries).filter(e => !e.isLocked && e.isPresent !== null).length;
  const lockedCount = Object.values(entries).filter(e => e.isLocked).length;

  return (
    <div className="space-y-4">
      {lockedCount > 0 && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <div className="flex items-start gap-3">
            <Lock size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-green-900">
              <p className="font-semibold">
                {lockedCount} ta xodim uchun bugun davomat allaqachon kiritilgan
              </p>
              <p className="mt-1 text-green-700">
                Kiritilgan davomatlar keyingi kunga qadar o'zgartirilmaydi.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Xodim
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Holat
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Kelgan Vaqti
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Ketgan Vaqti
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((employee) => {
                const entry = entries[employee.id];
                const isPresent = entry.isPresent === true;
                const isAbsent = entry.isPresent === false;
                const isLocked = entry.isLocked;
                
                return (
                  <tr 
                    key={employee.id} 
                    className={cn(
                      "hover:bg-slate-50",
                      isLocked && "bg-slate-50/50"
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isLocked && (
                          <Lock size={16} className="text-green-600 flex-shrink-0" />
                        )}
                        <div>
                          <p className={cn(
                            "text-sm font-medium",
                            isLocked ? "text-slate-500" : "text-slate-900"
                          )}>
                            {employee.name}
                          </p>
                          <p className="text-xs text-slate-500">{employee.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          onClick={() => handlePresent(employee.id)}
                          size="sm"
                          variant={isPresent ? "default" : "outline"}
                          disabled={isLocked}
                          className={cn(
                            "h-9 w-9 p-0",
                            isPresent && "bg-green-600 hover:bg-green-700",
                            isLocked && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <CheckCircle2 size={18} />
                        </Button>
                        <Button
                          onClick={() => handleAbsent(employee.id)}
                          size="sm"
                          variant={isAbsent ? "default" : "outline"}
                          disabled={isLocked}
                          className={cn(
                            "h-9 w-9 p-0",
                            isAbsent && "bg-red-600 hover:bg-red-700",
                            isLocked && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <XCircle size={18} />
                        </Button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="time"
                        value={entry.checkIn}
                        onChange={(e) => handleCheckInChange(employee.id, e.target.value)}
                        disabled={!isPresent || isLocked}
                        className={cn(
                          "w-32 mx-auto text-center",
                          isLocked && "bg-slate-50"
                        )}
                        placeholder="09:00"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="time"
                        value={entry.checkOut}
                        onChange={(e) => handleCheckOutChange(employee.id, e.target.value)}
                        disabled={!isPresent || isLocked}
                        className={cn(
                          "w-32 mx-auto text-center",
                          isLocked && "bg-slate-50"
                        )}
                        placeholder="18:00"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-600">
          {unlockedCount > 0 && (
            <span className="font-semibold text-[#173f38]">
              {unlockedCount} ta xodim davomati belgilandi
            </span>
          )}
        </p>
        <Button
          onClick={handleSaveAll}
          disabled={markAttendance.isPending || unlockedCount === 0}
          className="bg-[#173f38] hover:bg-[#0f312b]"
        >
          {markAttendance.isPending ? "Saqlanmoqda..." : "Barchasini Saqlash"}
        </Button>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
        <div className="flex items-start gap-3">
          <Clock size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">Qanday ishlatish:</p>
            <ol className="space-y-1 list-decimal list-inside">
              <li>Kelgan xodim uchun <CheckCircle2 size={14} className="inline text-green-600" /> tugmasini bosing</li>
              <li>Kelgan va ketgan vaqtlarini kiriting</li>
              <li>Kelmagan xodim uchun <XCircle size={14} className="inline text-red-600" /> tugmasini bosing</li>
              <li>"Barchasini Saqlash" tugmasini bosing</li>
            </ol>
            <p className="mt-3 text-xs text-blue-700 flex items-center gap-1">
              <Lock size={12} /> Kiritilgan davomatlar 24 soat ichida o'zgartirilmaydi
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
