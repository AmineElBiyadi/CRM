import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2, CheckCircle2, Home, DollarSign, MapPin, Ruler, Layers, Phone, Mail, Info } from 'lucide-react';
import { workflowApi, PropertyType } from '@/api/workflowApi';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

type Role = 'ai' | 'user';

interface Message {
  role: Role;
  text: string | React.ReactNode;
  isBot?: boolean;
}

type OnboardingStep = 
  | 'WELCOME'
  | 'FIRST_NAME' | 'LAST_NAME' | 'EMAIL' | 'PHONE' | 'SOURCE'
  | 'TYPE_SELECTION'
  | 'SELLER_TITLE' | 'SELLER_TYPE' | 'SELLER_ADDRESS' | 'SELLER_CITY' | 'SELLER_PRICE' | 'SELLER_SURFACE' | 'SELLER_ROOMS' | 'SELLER_FLOOR'
  | 'BUYER_BUDGET_MIN' | 'BUYER_BUDGET_MAX' | 'BUYER_TYPE' | 'BUYER_AREA' | 'BUYER_SURFACE' | 'BUYER_FLOOR'
  | 'ANOTHER_DOSSIER_PROMPT'
  | 'COMPLETED'
  | 'ERROR';

export function MurshidChatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('WELCOME');
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [userData, setUserData] = useState<any>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    source: '',
    clientId: '',
    clientType: '', // BUYER or SELLER
    dossier: {}
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Initial welcome message
    const welcome = async () => {
      addBotMessage(`👋 Bonjour et bienvenue !
      
Je suis **Murshid**, votre assistant immobilier personnel.
Je vais vous accompagner pour créer votre dossier en quelques minutes seulement.

Pour commencer, quel est votre prénom ?`);
      
      setCurrentStep('FIRST_NAME');
      
      // Pre-fetch property types
      try {
        const types = await workflowApi.getPropertyTypes();
        setPropertyTypes(types);
      } catch (e) {
        console.error("Failed to fetch property types", e);
      }
    };
    welcome();
  }, []);

  const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

  const addBotMessage = (text: string | React.ReactNode) => {
    setMessages(prev => [...prev, { role: 'ai', text, isBot: true }]);
  };

  const addUserMessage = (text: string) => {
    setMessages(prev => [...prev, { role: 'user', text }]);
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleNextStep = async (value: string) => {
    if (!value.trim() && currentStep !== 'SOURCE' && !currentStep.includes('TYPE') && !currentStep.includes('FLOOR')) return;

    addUserMessage(value);
    setInputValue('');
    setLoading(true);

    try {
      switch (currentStep) {
        case 'FIRST_NAME':
          setUserData({ ...userData, firstName: value });
          addBotMessage(`Enchanté ${value} ! Quel est votre nom de famille ?`);
          setCurrentStep('LAST_NAME');
          break;

        case 'LAST_NAME':
          setUserData({ ...userData, lastName: value });
          addBotMessage(`Très bien ${userData.firstName}. Quelle est votre adresse email ?`);
          setCurrentStep('EMAIL');
          break;

        case 'EMAIL':
          if (!validateEmail(value)) {
            addBotMessage("Oups, cette adresse email ne semble pas valide. Pourriez-vous la vérifier ?");
          } else {
            try {
                setLoading(true);
                await workflowApi.checkEmail(value);
                setUserData({ ...userData, email: value });
                addBotMessage("Parfait ! Et votre numéro de téléphone ?");
                setCurrentStep('PHONE');
            } catch (e: any) {
                if (e.response?.status === 409) {
                    addBotMessage("Oups ! Cette adresse email est déjà utilisée. Soit vous avez déjà créé votre compte, soit elle est déjà associée à un autre client. Pourriez-vous vérifier ou utiliser une autre adresse ?");
                } else {
                    addBotMessage("Oups, une petite erreur s'est produite. Pas d'inquiétude, réessayons ensemble !");
                }
            } finally {
                setLoading(false);
            }
          }
          break;

        case 'PHONE':
          setUserData({ ...userData, phone: value });
          addBotMessage("Merci ! Une dernière question pour votre profil : comment avez-vous connu notre agence ?");
          setCurrentStep('SOURCE');
          break;

        case 'SOURCE':
          const sourceData = { ...userData, source: value };
          setUserData(sourceData);
          
          // Create client in DB
          try {
            const clientId = await workflowApi.createClient({
              firstName: sourceData.firstName,
              lastName: sourceData.lastName,
              email: sourceData.email,
              phone: sourceData.phone,
              source: value
            });
            setUserData({ ...sourceData, clientId });
            
            await wait(600);
            addBotMessage("Excellent ! Votre profil est créé. ✨");
            await wait(600);
            addBotMessage("Maintenant, dites-moi : quel type de projet vous amène ?");
            setCurrentStep('TYPE_SELECTION');
          } catch (e: any) {
            if (e.response?.status === 409) {
                addBotMessage("Oups ! Cette adresse email est déjà utilisée. Soit vous avez déjà créé votre compte, soit elle est déjà associée à un autre client. Pourriez-vous vérifier ou utiliser une autre adresse ?");
                setCurrentStep('EMAIL'); // Redirect back to email step
            } else {
                addBotMessage("Oups, une petite erreur s'est produite lors de la création de votre profil. Pas d'inquiétude, réessayons ensemble !");
            }
          }
          break;

        case 'TYPE_SELECTION':
          const type = value.includes('acheter') ? 'BUYER' : 'SELLER';
          setUserData({ ...userData, clientType: type });
          
          // Re-fetch property types if empty (safety net)
          if (propertyTypes.length === 0) {
            try {
              const types = await workflowApi.getPropertyTypes();
              setPropertyTypes(types);
            } catch (e) {
              console.error("Delayed fetch failed", e);
            }
          }
          
          if (type === 'SELLER') {
            addBotMessage("Parfait, je vais vous aider à référencer votre bien. Quelques informations sur votre propriété :");
            await wait(600);
            addBotMessage("Quel est le titre de votre annonce ? (Ex: Appartement lumineux au centre-ville)");
            setCurrentStep('SELLER_TITLE');
          } else {
            addBotMessage("Très bien, je vais vous aider à trouver le bien idéal. Parlez-moi de votre projet d'achat :");
            await wait(600);
            addBotMessage("Quel est votre budget minimum (en €) ?");
            setCurrentStep('BUYER_BUDGET_MIN');
          }
          break;

        // --- SELLER FLOW ---
        case 'SELLER_TITLE':
          setUserData({ ...userData, dossier: { ...userData.dossier, propertyTitle: value } });
          addBotMessage("Très bien, on continue ! Quel est le type de bien ?");
          setCurrentStep('SELLER_TYPE');
          break;

        case 'SELLER_TYPE':
          const sellerTypeObj = propertyTypes.find(t => t.specificType === value);
          setUserData({ ...userData, dossier: { ...userData.dossier, propertyTypeId: sellerTypeObj?.idPropertyType } });
          addBotMessage("Super, nous avançons bien ! Quelle est l'adresse du bien ?");
          setCurrentStep('SELLER_ADDRESS');
          break;

        case 'SELLER_ADDRESS':
          setUserData({ ...userData, dossier: { ...userData.dossier, address: value } });
          addBotMessage("Dans quelle ville est situé le bien ?");
          setCurrentStep('SELLER_CITY');
          break;

        case 'SELLER_CITY':
          setUserData({ ...userData, dossier: { ...userData.dossier, city: value } });
          addBotMessage("Quel est le prix de vente souhaité (en €) ?");
          setCurrentStep('SELLER_PRICE');
          break;

        case 'SELLER_PRICE':
          setUserData({ ...userData, dossier: { ...userData.dossier, price: parseFloat(value) } });
          addBotMessage("Quelle est la superficie du bien (en m²) ?");
          setCurrentStep('SELLER_SURFACE');
          break;

        case 'SELLER_SURFACE':
          setUserData({ ...userData, dossier: { ...userData.dossier, surfaceM2: parseFloat(value) } });
          addBotMessage("Combien de pièces comporte le bien ?");
          setCurrentStep('SELLER_ROOMS');
          break;

        case 'SELLER_ROOMS':
          setUserData({ ...userData, dossier: { ...userData.dossier, numRooms: parseInt(value) } });
          addBotMessage("À quel étage se trouve le bien ?");
          setCurrentStep('SELLER_FLOOR');
          break;

        case 'SELLER_FLOOR':
          const sellerFinalData = { ...userData, dossier: { ...userData.dossier, floor: value === 'Indifférent' ? -1 : value.includes('Rez') ? 0 : parseInt(value) || 0 } };
          await createDossier(sellerFinalData);
          break;

        // --- BUYER FLOW ---
        case 'BUYER_BUDGET_MIN':
          setUserData({ ...userData, dossier: { ...userData.dossier, budgetMin: parseFloat(value) } });
          addBotMessage("Parfait ! Quel est votre budget maximum (en €) ?");
          setCurrentStep('BUYER_BUDGET_MAX');
          break;

        case 'BUYER_BUDGET_MAX':
          const bMax = parseFloat(value);
          if (bMax <= userData.dossier.budgetMin) {
            addBotMessage("Le budget maximum doit être supérieur au budget minimum. Pourriez-vous corriger ?");
          } else {
            setUserData({ ...userData, dossier: { ...userData.dossier, budgetMax: bMax } });
            addBotMessage("Très bien ! Quel type de bien recherchez-vous ?");
            setCurrentStep('BUYER_TYPE');
          }
          break;

        case 'BUYER_TYPE':
          const buyerTypeObj = propertyTypes.find(t => t.specificType === value);
          setUserData({ ...userData, dossier: { ...userData.dossier, propertyTypeId: buyerTypeObj?.idPropertyType } });
          addBotMessage("Super ! Dans quel quartier ou secteur souhaitez-vous habiter ?");
          setCurrentStep('BUYER_AREA');
          break;

        case 'BUYER_AREA':
          setUserData({ ...userData, dossier: { ...userData.dossier, preferredArea: value } });
          addBotMessage("Quelle superficie minimum recherchez-vous (en m²) ?");
          setCurrentStep('BUYER_SURFACE');
          break;

        case 'BUYER_SURFACE':
          setUserData({ ...userData, dossier: { ...userData.dossier, preferredSizeM2: parseFloat(value) } });
          addBotMessage("Quel étage préférez-vous ?");
          setCurrentStep('BUYER_FLOOR');
          break;

        case 'BUYER_FLOOR':
          const buyerFinalData = { ...userData, dossier: { ...userData.dossier, preferredFloor: value === 'Indifférent' ? -1 : value.includes('Rez') ? 0 : parseInt(value) || 0 } };
          await createDossier(buyerFinalData);
          break;

        case 'ANOTHER_DOSSIER_PROMPT':
          if (value === 'Oui') {
            setUserData({ ...userData, dossier: {}, clientType: '' });
            addBotMessage("C'est noté ! Nous recommençons. Quel type de projet vous amène pour ce nouveau dossier ?");
            setCurrentStep('TYPE_SELECTION');
          } else {
            addBotMessage("Entendu ! Merci encore pour votre confiance. Nos agents reviennent vers vous très vite. À très bientôt ! 👋");
            setCurrentStep('COMPLETED');
          }
          break;
      }
    } catch (error) {
      addBotMessage("Oups, une petite erreur s'est produite. Pas d'inquiétude, réessayons ensemble !");
    } finally {
      setLoading(false);
    }
  };

  const createDossier = async (data: any) => {
    try {
      setLoading(true);
      await workflowApi.createDossier({
        clientId: data.clientId,
        clientType: data.clientType,
        ...data.dossier
      });
      
      addBotMessage(`Félicitations ${data.firstName} ! 🎉`);
      await wait(600);
      addBotMessage("Votre dossier a été créé avec succès. Un agent vous contactera très prochainement pour la suite de votre projet immobilier. Nous sommes impatients de vous accompagner !");
      await wait(800);
      addBotMessage("Souhaitez-vous créer un autre dossier pour un nouveau projet ?");
      setCurrentStep('ANOTHER_DOSSIER_PROMPT');
    } catch (e) {
      addBotMessage("Oups, une petite erreur s'est produite lors de la création de votre dossier. Pas d'inquiétude, réessayons ensemble !");
    } finally {
      setLoading(false);
    }
  };

  const renderChoices = () => {
    if (loading) return null;

    if (currentStep === 'SOURCE') {
      return (
        <div className="flex flex-wrap gap-2 mt-2">
          {['Saisie manuelle', 'Site Web', 'Recommandation', 'Réseaux Sociaux', 'Autre'].map(s => (
            <button key={s} onClick={() => handleNextStep(s)} className="choice-btn">{s}</button>
          ))}
        </div>
      );
    }

    if (currentStep === 'TYPE_SELECTION') {
      return (
        <div className="flex flex-wrap gap-2 mt-2">
          <button onClick={() => handleNextStep('🏠 Je souhaite acheter')} className="choice-btn">🏠 Je souhaite acheter</button>
          <button onClick={() => handleNextStep('💰 Je souhaite vendre')} className="choice-btn">💰 Je souhaite vendre</button>
        </div>
      );
    }

    if (currentStep === 'SELLER_TYPE' || currentStep === 'BUYER_TYPE') {
      if (propertyTypes.length === 0) {
        return (
          <div className="text-[10px] text-muted-foreground italic p-2 bg-ghost/50 rounded-lg">
            Chargement des types de biens...
          </div>
        );
      }
      return (
        <div className="flex flex-wrap gap-2 mt-2">
          {propertyTypes.map((t, idx) => (
            <button key={t.idPropertyType || idx} onClick={() => handleNextStep(t.specificType)} className="choice-btn">{t.specificType}</button>
          ))}
        </div>
      );
    }

    if (currentStep === 'SELLER_FLOOR' || currentStep === 'BUYER_FLOOR') {
      return (
        <div className="flex flex-wrap gap-2 mt-2">
          {['Indifférent', 'Rez-de-chaussée', '1er étage', '2ème étage', '3ème étage et +', 'Dernier étage'].map(f => (
            <button key={f} onClick={() => handleNextStep(f)} className="choice-btn">{f}</button>
          ))}
        </div>
      );
    }

    if (currentStep === 'ANOTHER_DOSSIER_PROMPT') {
      return (
        <div className="flex flex-wrap gap-2 mt-2">
          <button onClick={() => handleNextStep('Oui')} className="choice-btn">✅ Oui, créer un autre dossier</button>
          <button onClick={() => handleNextStep('Non')} className="choice-btn">❌ Non, c'est tout pour moi</button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
      {/* Chat header */}
      <div className="h-14 px-6 border-b border-gray-50 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-vanilla flex items-center justify-center shadow-sm">
            <Bot size={18} className="text-eerie" />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase tracking-widest text-eerie">Murshid</span>
            <div className="flex items-center gap-1.5 text-[8px] font-black text-emerald-500 uppercase tracking-[0.2em] mt-0.5">
              <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" /> Assistant Actif
            </div>
          </div>
        </div>
      </div>

      {/* Chat messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-ghost/10 scroll-smooth">
        {messages.map((msg, i) => (
          <div key={i} className={cn(
            "max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-300",
            msg.role === 'ai'
              ? "bg-white text-eerie self-start border border-gray-100 shadow-sm rounded-tl-none font-medium prose-sm prose-p:leading-relaxed"
              : "bg-eerie text-white self-end rounded-tr-none font-bold shadow-md shadow-black/5"
          )}>
            {msg.role === 'ai' && typeof msg.text === 'string' ? (
              <div className="markdown-content"><ReactMarkdown>{msg.text}</ReactMarkdown></div>
            ) : (
              msg.text
            )}
          </div>
        ))}
        {loading && (
          <div className="self-start bg-white px-4 py-3 rounded-2xl border border-gray-100 shadow-sm rounded-tl-none">
            <Loader2 size={16} className="animate-spin text-alice/40" />
          </div>
        )}
        {renderChoices()}
      </div>

      {/* Input */}
      {currentStep !== 'COMPLETED' && (
        <form 
          onSubmit={e => { e.preventDefault(); handleNextStep(inputValue); }} 
          className="p-4 border-t border-gray-50 flex gap-3 bg-white shrink-0"
        >
          <input
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            disabled={loading || renderChoices() !== null}
            placeholder={loading ? "Murshid réfléchit..." : "Écrivez votre réponse ici..."}
            className="flex-1 bg-ghost/50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-vanilla/30 outline-none transition-all disabled:opacity-50"
          />
          <button 
            disabled={loading || !inputValue.trim() || renderChoices() !== null}
            className="w-12 h-12 rounded-xl bg-eerie text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100 shadow-lg shadow-black/10"
          >
            <Send size={18} />
          </button>
        </form>
      )}

      <style>{`
        .choice-btn {
          padding: 8px 16px;
          background: white;
          border: 1px border #eee;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #131313;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        .choice-btn:hover {
          background: #131313;
          color: #d4f0a0;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .markdown-content p {
          margin: 0;
        }
        .markdown-content p + p {
          margin-top: 1rem;
        }
      `}</style>
    </div>
  );
}
