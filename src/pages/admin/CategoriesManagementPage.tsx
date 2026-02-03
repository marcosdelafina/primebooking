import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    LayoutGrid,
    Plus,
    Edit,
    Trash2,
    ArrowLeft,
    Check,
    X,
    GripVertical
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getCategoriasEmpresa, createCategoriaEmpresa, updateCategoriaEmpresa, deleteCategoriaEmpresa } from '@/lib/supabase-services';
import { toast } from 'sonner';

export default function CategoriesManagementPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
    const [categoryToDelete, setCategoryToDelete] = useState<any | null>(null);

    // Form State
    const [form, setForm] = useState({ nome: '', slug: '', ativo: true, ordem: 0 });

    // Queries
    const { data: categories = [], isLoading } = useQuery({
        queryKey: ['global-categories'],
        queryFn: getCategoriasEmpresa
    });

    // Mutations
    const mutation = useMutation({
        mutationFn: async (data: any) => {
            if (selectedCategory) {
                return updateCategoriaEmpresa(selectedCategory.id, data);
            }
            return createCategoriaEmpresa(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['global-categories'] });
            toast.success(selectedCategory ? "Categoria atualizada!" : "Categoria criada!");
            setIsDialogOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            toast.error(error.message || "Erro ao salvar categoria.");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteCategoriaEmpresa,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['global-categories'] });
            toast.success("Categoria excluída.");
            setCategoryToDelete(null);
        },
        onError: (error: any) => {
            toast.error(error.message || "Erro ao excluir categoria.");
        }
    });

    // Handlers
    const resetForm = () => {
        setForm({ nome: '', slug: '', ativo: true, ordem: categories.length + 1 });
        setSelectedCategory(null);
    };

    const handleEdit = (category: any) => {
        setSelectedCategory(category);
        setForm({
            nome: category.nome,
            slug: category.slug,
            ativo: category.ativo,
            ordem: category.ordem
        });
        setIsDialogOpen(true);
    };

    const handleSave = () => {
        if (!form.nome || !form.slug) {
            toast.error("Nome e Slug são obrigatórios.");
            return;
        }
        mutation.mutate(form);
    };

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-");
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/global')}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <LayoutGrid className="h-6 w-6 text-blue-600" />
                                Categorias de Empresas
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                Gerencie as categorias disponíveis para os estabelecimentos.
                            </p>
                        </div>
                    </div>
                    <Button onClick={() => {
                        resetForm();
                        setIsDialogOpen(true);
                    }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Categoria
                    </Button>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Ordem</TableHead>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Slug</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                            Carregando categorias...
                                        </TableCell>
                                    </TableRow>
                                ) : categories.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground italic">
                                            Nenhuma categoria cadastrada.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    categories.map((cat: any) => (
                                        <TableRow key={cat.id}>
                                            <TableCell className="font-medium">
                                                <Badge variant="secondary">{cat.ordem}</Badge>
                                            </TableCell>
                                            <TableCell className="font-semibold">{cat.nome}</TableCell>
                                            <TableCell className="text-muted-foreground text-sm">{cat.slug}</TableCell>
                                            <TableCell>
                                                <Badge variant={cat.ativo ? "default" : "secondary"}>
                                                    {cat.ativo ? "Ativa" : "Inativa"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(cat)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-700"
                                                    onClick={() => setCategoryToDelete(cat)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Dialog: Create/Edit */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{selectedCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
                            <DialogDescription>
                                Essas informações serão usadas para filtros e classificação das empresas.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="nome">Nome da Categoria</Label>
                                <Input
                                    id="nome"
                                    value={form.nome}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setForm({
                                            ...form,
                                            nome: val,
                                            slug: selectedCategory ? form.slug : generateSlug(val)
                                        });
                                    }}
                                    placeholder="Ex: Pet Shop"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug (URL)</Label>
                                <Input
                                    id="slug"
                                    value={form.slug}
                                    onChange={e => setForm({ ...form, slug: e.target.value })}
                                    placeholder="pet-shop"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="ordem">Ordem de Exibição</Label>
                                    <Input
                                        id="ordem"
                                        type="number"
                                        value={form.ordem}
                                        onChange={e => setForm({ ...form, ordem: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2 flex flex-col justify-end pb-2">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="ativo"
                                            checked={form.ativo}
                                            onCheckedChange={v => setForm({ ...form, ativo: v })}
                                        />
                                        <Label htmlFor="ativo">Categoria Ativa</Label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSave} disabled={mutation.isPending}>
                                {mutation.isPending ? "Salvando..." : "Salvar Categoria"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Alert: Delete Confirmation */}
                <AlertDialog open={!!categoryToDelete} onOpenChange={o => !o && setCategoryToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Categoria?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Tem certeza que deseja excluir a categoria <strong>{categoryToDelete?.nome}</strong>?
                                Isso pode afetar as empresas que estão usando esta categoria.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => deleteMutation.mutate(categoryToDelete.id)}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                Excluir Permanentemente
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </AdminLayout>
    );
}
