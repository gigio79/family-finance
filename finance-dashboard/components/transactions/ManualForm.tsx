"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2, Sparkles, Zap } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Transaction } from "@/lib/types"
import { extractFinancialData } from "@/lib/extractor"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"

const formSchema = z.object({
    date: z.date({
        message: "A data é obrigatória.",
    }),
    amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
        message: "O valor deve ser um número positivo.",
    }),
    description: z.string().min(2, {
        message: "A descrição deve ter pelo menos 2 caracteres.",
    }),
    type: z.string({
        message: "Selecione o tipo de transação.",
    }),
    category: z.string().optional(),
    usuario: z.string(),
})

interface ManualFormProps {
    onSubmit: (data: Partial<Transaction>) => Promise<void>;
    isLoading: boolean;
}

export function ManualForm({ onSubmit, isLoading: isSubmitting }: ManualFormProps) {
    const [isExtracting, setIsExtracting] = useState(false);
    const [notificationText, setNotificationText] = useState("");

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            description: "",
            amount: "",
            type: "Debit",
            category: "Auto (AI)",
            usuario: typeof window !== 'undefined' ? localStorage.getItem('neo_user') || "Giovanni" : "Giovanni",
        },
    })

    // Persistir o usuário selecionado
    const selectedUser = form.watch("usuario");
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('neo_user', selectedUser);
        }
    }, [selectedUser]);

    async function handleSubmit(values: z.infer<typeof formSchema>) {
        await onSubmit({
            date: values.date.toISOString(),
            amount: -Math.abs(parseFloat(values.amount)),
            description: values.description,
            category: values.category === "Auto (AI)" ? undefined : values.category,
            type: values.type,
            usuario: values.usuario,
        });
        form.reset({
            date: new Date(),
            amount: "",
            description: "",
            type: "Debit",
            category: "Auto (AI)",
            usuario: typeof window !== 'undefined' ? localStorage.getItem('neo_user') || "Giovanni" : "Giovanni",
        });
        setNotificationText("");
    }

    const handleExtract = async () => {
        if (!notificationText.trim()) return;

        try {
            setIsExtracting(true);
            const data = await extractFinancialData(notificationText);

            if (data.valor) {
                form.setValue("amount", data.valor.toString());
            }
            if (data.descricao_original) {
                // Use establishment if found, otherwise generic description
                form.setValue("description", data.estabelecimento || data.descricao_original.substring(0, 50));
            }
            if (data.tipo) {
                const typeMap: Record<string, string> = {
                    'debito': 'Debit',
                    'credito': 'Credit',
                    'pix_recebido': 'PIX',
                    'pix_enviado': 'PIX',
                };
                form.setValue("type", typeMap[data.tipo] || 'Debit');
            }
            if (data.data) {
                form.setValue("date", new Date(data.data));
            }
        } catch (error) {
            console.error("Extraction failed", error);
        } finally {
            setIsExtracting(false);
        }
    };

    return (
        <Form {...form}>
                <FormField
                    control={form.control}
                    name="usuario"
                    render={({ field }) => (
                        <FormItem className="mb-4">
                            <FormLabel className="text-xs text-primary font-bold uppercase tracking-wider">Quem está lançando?</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger className="bg-slate-50 border-transparent rounded-2xl h-11 focus:ring-primary/20 transition-all">
                                        <SelectValue placeholder="Selecione o membro" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Giovanni">Giovanni</SelectItem>
                                    <SelectItem value="Esposa">Esposa</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )}
                />

                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Data</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full h-11 pl-3 text-left font-normal rounded-2xl bg-slate-50 border-transparent focus:ring-primary/20 transition-all",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value ? (
                                                    format(field.value, "PPP")
                                                ) : (
                                                    <span>Selecione uma data</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) =>
                                                date > new Date() || date < new Date("1900-01-01")
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Valor (R$)</FormLabel>
                                <FormControl>
                                    <Input placeholder="0.00" {...field} className="h-11 rounded-2xl bg-slate-50 border-transparent focus:ring-primary/20 transition-all" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Descrição</FormLabel>
                            <FormControl>
                                <Input placeholder="Compras de mercado, Uber..." {...field} className="h-11 rounded-2xl bg-slate-50 border-transparent focus:ring-primary/20 transition-all" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tipo</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="h-11 rounded-2xl bg-slate-50 border-transparent focus:ring-primary/20 transition-all">
                                            <SelectValue placeholder="Selecione o tipo" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Debit">Débito</SelectItem>
                                        <SelectItem value="Credit">Crédito</SelectItem>
                                        <SelectItem value="PIX">PIX</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Categoria</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="h-11 rounded-2xl bg-slate-50 border-transparent focus:ring-primary/20 transition-all">
                                            <SelectValue placeholder="Selecione a categoria" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Auto (AI)">✨ Automático (IA)</SelectItem>
                                        <SelectItem value="Alimentação">Alimentação</SelectItem>
                                        <SelectItem value="Transporte">Transporte</SelectItem>
                                        <SelectItem value="Saúde">Saúde</SelectItem>
                                        <SelectItem value="Moradia">Moradia</SelectItem>
                                        <SelectItem value="Lazer">Lazer</SelectItem>
                                        <SelectItem value="Outros">Outros</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="p-5 rounded-[24px] bg-slate-50 border-none space-y-4">
                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                        <Sparkles className="h-4 w-4" />
                        <span>Preenchimento Inteligente</span>
                    </div>
                    <Textarea 
                        placeholder="Cole aqui a mensagem do banco..." 
                        className="bg-white border-transparent rounded-[20px] resize-none min-h-[100px] focus:ring-primary/20 transition-all text-sm"
                        value={notificationText}
                        onChange={(e) => setNotificationText(e.target.value)}
                    />
                    <Button 
                        type="button" 
                        variant="secondary" 
                        size="sm" 
                        className="w-full gap-2 text-xs h-10 rounded-full font-bold bg-white text-primary hover:bg-white/80 shadow-sm"
                        onClick={handleExtract}
                        disabled={isExtracting || !notificationText.trim()}
                    >
                        {isExtracting ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                            <Zap className="h-3 w-3" />
                        )}
                        Extrair Dados com IA
                    </Button>
                </div>

                <Button type="submit" className="w-full h-12 rounded-full font-bold text-base shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all mt-4" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Salvando...
                        </>
                    ) : (
                        "Confirmar Transação"
                    )}
                </Button>
            </form>
        </Form>
    )
}
