package com.smartestatehub.shared;

import com.smartestatehub.auth.model.InternalUser;
import com.smartestatehub.auth.model.Role;
import com.smartestatehub.auth.repository.UserRepository;
import com.smartestatehub.crm.model.*;
import com.smartestatehub.crm.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

        private final UserRepository userRepository;
        private final ClientRepository clientRepository;
        private final PropertyTypeRepository propertyTypeRepository;
        private final PropertyRepository propertyRepository;
        private final DealRepository dealRepository;
        private final ContractRepository contractRepository;
        private final OfferRepository offerRepository;
        private final MeetingRepository meetingRepository;
        private final InteractionRepository interactionRepository;
        private final DocumentRepository documentRepository;

        @Override
        @Transactional
        public void run(String... args) throws Exception {
                InternalUser admin = null;
                InternalUser agent = null;
                Client buyerClient = null;
                Client sellerClient = null;
                Property penthouse = null;
                Deal buyerDeal = null;
                Offer offer1 = null;

                // 1. Seed Users (InternalUser)
                if (userRepository.count() == 0) {
                        System.out.println("🌱 Seeding Internal Users (Admin/Agent)...");
                        admin = InternalUser.builder()
                                        .firstName("Amine")
                                        .lastName("El Biyadi")
                                        .email("admin@smartestatehub.com")
                                        .password("admin123")
                                        .phone("+212600000000")
                                        .role(Role.ADMIN)
                                        .build();
                        admin = userRepository.save(admin);

                        agent = InternalUser.builder()
                                        .firstName("Sarah")
                                        .lastName("Laroui")
                                        .email("agent@smartestatehub.com")
                                        .password("agent123")
                                        .phone("+212611111111")
                                        .role(Role.AGENT)
                                        .build();
                        agent = userRepository.save(agent);
                        System.out.println("✅ Users seeded.");
                } else {
                        // Retrieve first admin and agent if already existing
                        admin = userRepository.findAll().stream()
                                        .filter(u -> u.getRole() == Role.ADMIN)
                                        .findFirst()
                                        .orElse(null);
                        agent = userRepository.findAll().stream()
                                        .filter(u -> u.getRole() == Role.AGENT)
                                        .findFirst()
                                        .orElse(null);
                }

                // 2. Fetch Property Types (déjà insérés via le script SQL supabase_enums_and_inserts.sql)
                PropertyType apartmentType = propertyTypeRepository.findAll().stream()
                                .filter(pt -> pt.getSpecificType().contains("Apartment"))
                                .findFirst()
                                .orElse(null);
                PropertyType houseType = propertyTypeRepository.findAll().stream()
                                .filter(pt -> pt.getSpecificType().contains("House"))
                                .findFirst()
                                .orElse(null);

                // 3. Seed Clients & Folders (Cascaded)
                buyerClient = clientRepository.findByEmail("buyer@client.com").orElse(null);
                sellerClient = clientRepository.findByEmail("seller@client.com").orElse(null);

                if (buyerClient == null || sellerClient == null) {
                        System.out.println("🌱 Seeding Clients and Folders...");

                        if (buyerClient == null) {
                                buyerClient = Client.builder()
                                                .firstName("Yassine")
                                                .lastName("Bennani")
                                                .email("buyer@client.com")
                                                .password("buyer123")
                                                .phone("+212622222222")
                                                .build();

                                ClientFolder buyerFolder = ClientFolder.builder()
                                                .client(buyerClient)
                                                .assignedAgent(agent)
                                                .createdByAgent(agent)
                                                .clientType(ClientType.BUYER)
                                                .build();

                                BuyerFolder buyerProfile = BuyerFolder.builder()
                                                .clientFolder(buyerFolder)
                                                .budgetMin(150000.0)
                                                .budgetMax(250000.0)
                                                .preferredSizeM2(80.0)
                                                .preferredArea("Gauthier, Casablanca")
                                                .preferredFloor(2)
                                                .propertyType(apartmentType)
                                                .build();
                                buyerFolder.setBuyerFolder(buyerProfile);
                                buyerClient.getClientFolders().add(buyerFolder); // needed for cascade
                                buyerClient = clientRepository.save(buyerClient);
                        }

                        if (sellerClient == null) {
                                sellerClient = Client.builder()
                                                .firstName("Fatima")
                                                .lastName("Zahra")
                                                .email("seller@client.com")
                                                .password("seller123")
                                                .phone("+212633333333")
                                                .build();

                                ClientFolder sellerFolder = ClientFolder.builder()
                                                .client(sellerClient)
                                                .assignedAgent(agent)
                                                .createdByAgent(agent)
                                                .clientType(ClientType.SELLER)
                                                .build();

                                SellerFolder sellerProfile = SellerFolder.builder()
                                                .clientFolder(sellerFolder)
                                                .build();
                                sellerFolder.setSellerFolder(sellerProfile);
                                sellerClient.getClientFolders().add(sellerFolder); // needed for cascade
                                sellerClient = clientRepository.save(sellerClient);
                        }
                        System.out.println("✅ Clients and Folders seeded.");
                }

                // 4. Seed Properties
                penthouse = propertyRepository.findAll().stream().findFirst().orElse(null);
                if (penthouse == null && sellerClient != null) {
                        System.out.println("🌱 Seeding Properties...");

                        // Re-fetch folders to avoid LazyInitializationException if from previous run
                        SellerFolder sellerProfile = sellerClient.getClientFolders().stream()
                                        .filter(f -> f.getSellerFolder() != null)
                                        .map(ClientFolder::getSellerFolder)
                                        .findFirst()
                                        .orElse(null);

                        if (sellerProfile != null) {
                                penthouse = Property.builder()
                                                .title("Luxury Penthouse Gauthier")
                                                .address("15 Rue de Gauthier")
                                                .city("Casablanca")
                                                .price(220000.0)
                                                .surfaceM2(95.0)
                                                .numRooms(3)
                                                .floor(5)
                                                .propertyType(apartmentType)
                                                .sellerFolder(sellerProfile)
                                                .isAvailable(true)
                                                .build();
                                penthouse = propertyRepository.save(penthouse);

                                Property villa = Property.builder()
                                                .title("Modern Villa Californie")
                                                .address("Avenue Californie")
                                                .city("Casablanca")
                                                .price(650000.0)
                                                .surfaceM2(350.0)
                                                .numRooms(6)
                                                .floor(0)
                                                .propertyType(houseType)
                                                .sellerFolder(sellerProfile)
                                                .isAvailable(true)
                                                .build();
                                propertyRepository.save(villa);
                                System.out.println("✅ Properties seeded.");
                        }
                }

                // 5. Seed Deals
                buyerDeal = dealRepository.findAll().stream().findFirst().orElse(null);
                if (buyerDeal == null && buyerClient != null) {
                        System.out.println("🌱 Seeding Deals...");

                        ClientFolder buyerFolder = buyerClient.getClientFolders().stream()
                                        .filter(f -> f.getClientType() == ClientType.BUYER)
                                        .findFirst()
                                        .orElse(null);

                        if (buyerFolder != null) {
                                buyerDeal = Deal.builder()
                                                .aiLeadScore(85)
                                                .aiRecommendedAction(
                                                                "Send a contract draft for the Gauthier Penthouse.")
                                                .aiScoreExplanation(
                                                                "Client has high budget match and has requested a second visit.")
                                                .aiSummary("Looking for a modern 3-room apartment in Casablanca with balcony.")
                                                .isUrgent(true)
                                                .stage(DealStage.NEGOTIATION)
                                                .clientFolder(buyerFolder)
                                                .build();
                                buyerDeal = dealRepository.save(buyerDeal);
                                System.out.println("✅ Deals seeded.");
                        }
                }

                // 6. Seed Contracts
                if (contractRepository.count() == 0 && buyerDeal != null) {
                        System.out.println("🌱 Seeding Contracts...");
                        Contract contract = Contract.builder()
                                        .agreedPrice(215000.0)
                                        .depositAmount(21500.0)
                                        .status(ContractStatus.DRAFT)
                                        .aiRiskSummary("Standard contract with high deposit guarantee. No major risk flags identified.")
                                        .deal(buyerDeal)
                                        .build();
                        contractRepository.save(contract);
                        System.out.println("✅ Contracts seeded.");
                }

                // 7. Seed Offers
                offer1 = offerRepository.findAll().stream().findFirst().orElse(null);
                if (offer1 == null && buyerDeal != null && penthouse != null) {
                        System.out.println("🌱 Seeding Offers...");
                        offer1 = Offer.builder()
                                        .offerAmount(215000.0)
                                        .status(OfferStatus.ACCEPTED)
                                        .deal(buyerDeal)
                                        .property(penthouse)
                                        .build();
                        offer1 = offerRepository.save(offer1);

                        Offer offer2 = Offer.builder()
                                        .offerAmount(210000.0)
                                        .status(OfferStatus.PENDING)
                                        .deal(buyerDeal)
                                        .property(penthouse)
                                        .build();
                        offerRepository.save(offer2);
                        System.out.println("✅ Offers seeded.");
                }

                // 8. Seed Meetings
                if (meetingRepository.count() == 0 && buyerDeal != null) {
                        System.out.println("🌱 Seeding Meetings...");
                        Meeting meeting1 = Meeting.builder()
                                        .scheduledAt(LocalDateTime.now().plusDays(2))
                                        .notesLogged("Discuss contract terms and sign the draft agreement.")
                                        .status(MeetingStatus.SCHEDULED)
                                        .type(MeetingType.CONTRACT_SIGNING)
                                        .reminder1hSent(false)
                                        .reminder24hSent(false)
                                        .deal(buyerDeal)
                                        .offer(offer1)
                                        .build();
                        meetingRepository.save(meeting1);

                        Meeting meeting2 = Meeting.builder()
                                        .scheduledAt(LocalDateTime.now().minusDays(1))
                                        .notesLogged("First property visit. Showed the penthouse layout.")
                                        .status(MeetingStatus.COMPLETED)
                                        .type(MeetingType.PROPERTY_VISIT)
                                        .reminder1hSent(true)
                                        .reminder24hSent(true)
                                        .deal(buyerDeal)
                                        .build();
                        meetingRepository.save(meeting2);
                        System.out.println("✅ Meetings seeded.");
                }

                // 9. Seed Interactions
                if (interactionRepository.count() == 0 && buyerDeal != null && agent != null) {
                        System.out.println("🌱 Seeding Interactions...");
                        Interaction int1 = Interaction.builder()
                                        .type(InteractionType.CALL)
                                        .description("Initial call with Yassine Bennani. Discussed preferred budget and area.")
                                        .occurredAt(LocalDateTime.now().minusDays(5))
                                        .durationMinutes(15)
                                        .deal(buyerDeal)
                                        .user(agent)
                                        .build();
                        interactionRepository.save(int1);

                        Interaction int2 = Interaction.builder()
                                        .type(InteractionType.EMAIL)
                                        .description("Sent list of available apartments in Gauthier.")
                                        .occurredAt(LocalDateTime.now().minusDays(3))
                                        .durationMinutes(5)
                                        .deal(buyerDeal)
                                        .user(agent)
                                        .build();
                        interactionRepository.save(int2);

                        Interaction int3 = Interaction.builder()
                                        .type(InteractionType.VISIT)
                                        .description("Visited the Luxury Penthouse Gauthier. Client was very impressed.")
                                        .occurredAt(LocalDateTime.now().minusDays(1))
                                        .durationMinutes(45)
                                        .deal(buyerDeal)
                                        .user(agent)
                                        .build();
                        interactionRepository.save(int3);
                        System.out.println("✅ Interactions seeded.");
                }

                // 10. Seed Documents
                if (documentRepository.count() == 0 && buyerDeal != null) {
                        System.out.println("🌱 Seeding Documents...");
                        Document doc1 = Document.builder()
                                        .documentType(DocumentType.INCOM_CERT)
                                        .filePath("/uploads/documents/income_cert_yassine.pdf")
                                        .confirmedReceived(true)
                                        .isEmbedded(true)
                                        .deal(buyerDeal)
                                        .build();
                        documentRepository.save(doc1);

                        Document doc2 = Document.builder()
                                        .documentType(DocumentType.NATIONAL_ID)
                                        .filePath("/uploads/documents/id_card_yassine.pdf")
                                        .confirmedReceived(true)
                                        .isEmbedded(false)
                                        .deal(buyerDeal)
                                        .build();
                        documentRepository.save(doc2);
                        System.out.println("✅ Documents seeded.");
                }
        }
}
