import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Phone, Mail, User, Home, Tag } from 'lucide-react'
import { NeuCard } from '@/components/ui/neu-card'
import { SoftBadge } from '@/components/ui/design-bits'

const formSchema = z.object({
  firstName: z.string().min(2, "Le prénom est trop court"),
  lastName: z.string().min(2, "Le nom est trop court"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(10, "Numéro de téléphone invalide"),
  interest: z.enum(['buyer', 'seller', 'other']),
})

export function LeadForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      interest: "buyer",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
    toast.success("Demande envoyée ! Nous vous contacterons bientôt.")
    form.reset()
  }

  return (
    <NeuCard size="lg" className="max-w-lg mx-auto border-border/50 shadow-neu-lg">
      <div className="text-center mb-8">
        <SoftBadge tone="info" className="mb-2">Contact Direct</SoftBadge>
        <h3 className="text-2xl font-bold">Parlons de votre projet</h3>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Prénom</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                      <Input placeholder="Mehdi" className="pl-11 input-neu bg-ghost/50" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nom</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                      <Input placeholder="Alami" className="pl-11 input-neu bg-ghost/50" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Professionnel</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                    <Input placeholder="mehdi.alami@email.com" className="pl-11 input-neu bg-ghost/50" {...field} />
                  </div>
                </FormControl>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Téléphone</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                    <Input placeholder="06 61 00 00 00" className="pl-11 input-neu bg-ghost/50" {...field} />
                  </div>
                </FormControl>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="interest"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Votre objectif</FormLabel>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { val: 'buyer', label: 'Achat', icon: Home, color: 'bg-honeydew/40' },
                    { val: 'seller', label: 'Vente', icon: Tag, color: 'bg-vanilla/40' },
                    { val: 'other', label: 'Conseil', icon: User, color: 'bg-alice/40' }
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => field.onChange(opt.val)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ${
                        field.value === opt.val 
                          ? `${opt.color} border-transparent shadow-neu-inset scale-[0.98]` 
                          : 'bg-ghost/50 border-border/50 hover:bg-alice/20'
                      }`}
                    >
                      <opt.icon className={`h-5 w-5 mb-1.5 ${field.value === opt.val ? 'text-eerie' : 'text-muted-foreground'}`} />
                      <span className={`text-[11px] font-bold uppercase ${field.value === opt.val ? 'text-eerie' : 'text-muted-foreground'}`}>{opt.label}</span>
                    </button>
                  ))}
                </div>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full h-14 text-base font-bold bg-eerie text-ghost hover:opacity-90 rounded-xl mt-6 shadow-neu transition-all active:scale-95 border-none">
            Envoyer ma demande
          </Button>
        </form>
      </Form>
    </NeuCard>
  )
}
