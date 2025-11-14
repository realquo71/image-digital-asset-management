import { PrismaClient, UserRole, AssetStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clear existing data (development only!)
  console.log('🗑️  Clearing existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.arcoTag.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.collectionAsset.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.user.deleteMany();
  await prisma.arCoVocabularyCache.deleteMany();

  // Create test users
  console.log('👥 Creating test users...');
  const hashedPassword = await bcrypt.hash('password123', 12);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@culturalheritage.test',
      name: 'Admin User',
      role: UserRole.ADMIN,
      passwordHash: hashedPassword,
    },
  });
  console.log(`   ✓ Created Admin: ${admin.email}`);

  const curator = await prisma.user.create({
    data: {
      email: 'curator@culturalheritage.test',
      name: 'Maria Curator',
      role: UserRole.CURATOR,
      passwordHash: hashedPassword,
    },
  });
  console.log(`   ✓ Created Curator: ${curator.email}`);

  const researcher = await prisma.user.create({
    data: {
      email: 'researcher@culturalheritage.test',
      name: 'Giovanni Researcher',
      role: UserRole.RESEARCHER,
      passwordHash: hashedPassword,
    },
  });
  console.log(`   ✓ Created Researcher: ${researcher.email}`);

  const viewer = await prisma.user.create({
    data: {
      email: 'viewer@culturalheritage.test',
      name: 'Lucia Viewer',
      role: UserRole.VIEWER,
      passwordHash: hashedPassword,
    },
  });
  console.log(`   ✓ Created Viewer: ${viewer.email}`);

  // Create sample assets
  console.log('\n🖼️  Creating sample assets...');

  const asset1 = await prisma.asset.create({
    data: {
      title: 'David di Michelangelo',
      description: 'Replica fotografica della scultura rinascimentale del David di Michelangelo, capolavoro conservato alla Galleria dell\'Accademia di Firenze.',
      filename: 'david-michelangelo.jpg',
      mimeType: 'image/jpeg',
      fileSize: 2456789,
      status: AssetStatus.PUBLISHED,
      sharepointUrl: 'https://example.sharepoint.com/sites/dam/david-michelangelo.jpg',
      thumbnailUrl: 'https://example.sharepoint.com/sites/dam/thumbs/david-michelangelo_thumb.jpg',
      width: 3000,
      height: 4500,
      camera: 'Canon EOS 5D Mark IV',
      captureDate: new Date('2023-06-15'),
      creatorId: curator.id,
    },
  });
  console.log(`   ✓ Created asset: ${asset1.title}`);

  const asset2 = await prisma.asset.create({
    data: {
      title: 'Colosseo Romano',
      description: 'Vista panoramica del Colosseo, anfiteatro Flavio, simbolo di Roma e monumento più visitato d\'Italia.',
      filename: 'colosseo-panorama.jpg',
      mimeType: 'image/jpeg',
      fileSize: 3567890,
      status: AssetStatus.PUBLISHED,
      sharepointUrl: 'https://example.sharepoint.com/sites/dam/colosseo-panorama.jpg',
      thumbnailUrl: 'https://example.sharepoint.com/sites/dam/thumbs/colosseo-panorama_thumb.jpg',
      width: 4000,
      height: 3000,
      camera: 'Nikon D850',
      captureDate: new Date('2023-07-20'),
      gpsLatitude: 41.8902,
      gpsLongitude: 12.4922,
      creatorId: curator.id,
    },
  });
  console.log(`   ✓ Created asset: ${asset2.title}`);

  const asset3 = await prisma.asset.create({
    data: {
      title: 'Nascita di Venere - Botticelli',
      description: 'Riproduzione digitale del dipinto "La nascita di Venere" di Sandro Botticelli, conservato alla Galleria degli Uffizi.',
      filename: 'nascita-venere.jpg',
      mimeType: 'image/jpeg',
      fileSize: 4123456,
      status: AssetStatus.PUBLISHED,
      sharepointUrl: 'https://example.sharepoint.com/sites/dam/nascita-venere.jpg',
      thumbnailUrl: 'https://example.sharepoint.com/sites/dam/thumbs/nascita-venere_thumb.jpg',
      width: 5000,
      height: 3500,
      creatorId: curator.id,
    },
  });
  console.log(`   ✓ Created asset: ${asset3.title}`);

  const asset4 = await prisma.asset.create({
    data: {
      title: 'Pompei - Casa del Fauno',
      description: 'Fotografia archeologica della Casa del Fauno negli scavi di Pompei, una delle domus più grandi e lussuose.',
      filename: 'pompei-casa-fauno.jpg',
      mimeType: 'image/jpeg',
      fileSize: 2890123,
      status: AssetStatus.DRAFT,
      sharepointUrl: 'https://example.sharepoint.com/sites/dam/pompei-casa-fauno.jpg',
      thumbnailUrl: 'https://example.sharepoint.com/sites/dam/thumbs/pompei-casa-fauno_thumb.jpg',
      width: 3500,
      height: 2500,
      captureDate: new Date('2023-08-10'),
      gpsLatitude: 40.7506,
      gpsLongitude: 14.4897,
      creatorId: curator.id,
    },
  });
  console.log(`   ✓ Created asset: ${asset4.title}`);

  // Create tags
  console.log('\n🏷️  Creating tags...');

  const tagRinascimento = await prisma.tag.create({
    data: {
      name: 'Rinascimento',
      assets: {
        connect: [{ id: asset1.id }, { id: asset3.id }],
      },
    },
  });
  console.log(`   ✓ Created tag: ${tagRinascimento.name}`);

  const tagScultura = await prisma.tag.create({
    data: {
      name: 'Scultura',
      assets: {
        connect: [{ id: asset1.id }],
      },
    },
  });
  console.log(`   ✓ Created tag: ${tagScultura.name}`);

  const tagArcheologia = await prisma.tag.create({
    data: {
      name: 'Archeologia',
      assets: {
        connect: [{ id: asset2.id }, { id: asset4.id }],
      },
    },
  });
  console.log(`   ✓ Created tag: ${tagArcheologia.name}`);

  const tagPittura = await prisma.tag.create({
    data: {
      name: 'Pittura',
      assets: {
        connect: [{ id: asset3.id }],
      },
    },
  });
  console.log(`   ✓ Created tag: ${tagPittura.name}`);

  // Create ArCo tags
  console.log('\n🎨 Creating ArCo tags...');

  await prisma.arcoTag.create({
    data: {
      arcoUri: 'https://w3id.org/arco/resource/CulturalPropertyType/scultura',
      label: 'Scultura',
      category: 'CULTURAL_PROPERTY_TYPE',
      notation: 'S',
      assetId: asset1.id,
    },
  });
  console.log('   ✓ Created ArCo tag: Scultura (Cultural Property Type)');

  await prisma.arcoTag.create({
    data: {
      arcoUri: 'https://w3id.org/arco/resource/Material/marmo',
      label: 'Marmo',
      category: 'MATERIAL',
      notation: 'MAR',
      assetId: asset1.id,
    },
  });
  console.log('   ✓ Created ArCo tag: Marmo (Material)');

  await prisma.arcoTag.create({
    data: {
      arcoUri: 'https://w3id.org/arco/resource/CulturalPropertyType/architettura',
      label: 'Architettura',
      category: 'CULTURAL_PROPERTY_TYPE',
      notation: 'A',
      assetId: asset2.id,
    },
  });
  console.log('   ✓ Created ArCo tag: Architettura (Cultural Property Type)');

  await prisma.arcoTag.create({
    data: {
      arcoUri: 'https://w3id.org/arco/resource/CulturalPropertyType/dipinto',
      label: 'Dipinto',
      category: 'CULTURAL_PROPERTY_TYPE',
      notation: 'D',
      assetId: asset3.id,
    },
  });
  console.log('   ✓ Created ArCo tag: Dipinto (Cultural Property Type)');

  await prisma.arcoTag.create({
    data: {
      arcoUri: 'https://w3id.org/arco/resource/Technique/tempera',
      label: 'Tempera su tavola',
      category: 'TECHNIQUE',
      notation: 'TMP',
      assetId: asset3.id,
    },
  });
  console.log('   ✓ Created ArCo tag: Tempera su tavola (Technique)');

  // Create collections
  console.log('\n📚 Creating collections...');

  const collection1 = await prisma.collection.create({
    data: {
      name: 'Arte Rinascimentale Italiana',
      description: 'Raccolta di opere d\'arte del periodo rinascimentale italiano, dal XIV al XVI secolo.',
      isPublic: true,
      creatorId: curator.id,
      assets: {
        create: [
          { assetId: asset1.id },
          { assetId: asset3.id },
        ],
      },
    },
  });
  console.log(`   ✓ Created collection: ${collection1.name} (${2} assets)`);

  const collection2 = await prisma.collection.create({
    data: {
      name: 'Siti Archeologici di Roma',
      description: 'Documentazione fotografica dei principali siti archeologici romani.',
      isPublic: true,
      creatorId: curator.id,
      assets: {
        create: [
          { assetId: asset2.id },
          { assetId: asset4.id },
        ],
      },
    },
  });
  console.log(`   ✓ Created collection: ${collection2.name} (${2} assets)`);

  const collection3 = await prisma.collection.create({
    data: {
      name: 'Collezione Privata Ricercatore',
      description: 'Collezione personale per ricerca accademica.',
      isPublic: false,
      creatorId: researcher.id,
      assets: {
        create: [
          { assetId: asset1.id },
        ],
      },
    },
  });
  console.log(`   ✓ Created collection: ${collection3.name} (${1} asset)`);

  // Create ArCo vocabulary cache (sample entries)
  console.log('\n📖 Creating ArCo vocabulary cache...');

  const vocabularyEntries = [
    { uri: 'https://w3id.org/arco/resource/CulturalPropertyType/scultura', label: 'Scultura', category: 'CULTURAL_PROPERTY_TYPE', notation: 'S', usageCount: 150 },
    { uri: 'https://w3id.org/arco/resource/CulturalPropertyType/dipinto', label: 'Dipinto', category: 'CULTURAL_PROPERTY_TYPE', notation: 'D', usageCount: 230 },
    { uri: 'https://w3id.org/arco/resource/CulturalPropertyType/architettura', label: 'Architettura', category: 'CULTURAL_PROPERTY_TYPE', notation: 'A', usageCount: 180 },
    { uri: 'https://w3id.org/arco/resource/Material/marmo', label: 'Marmo', category: 'MATERIAL', notation: 'MAR', usageCount: 120 },
    { uri: 'https://w3id.org/arco/resource/Material/bronzo', label: 'Bronzo', category: 'MATERIAL', notation: 'BRZ', usageCount: 95 },
    { uri: 'https://w3id.org/arco/resource/Technique/tempera', label: 'Tempera', category: 'TECHNIQUE', notation: 'TMP', usageCount: 80 },
    { uri: 'https://w3id.org/arco/resource/Technique/olio', label: 'Olio su tela', category: 'TECHNIQUE', notation: 'OLI', usageCount: 200 },
  ];

  for (const entry of vocabularyEntries) {
    await prisma.arCoVocabularyCache.create({
      data: entry,
    });
  }
  console.log(`   ✓ Created ${vocabularyEntries.length} ArCo vocabulary cache entries`);

  // Create audit logs
  console.log('\n📋 Creating sample audit logs...');

  await prisma.auditLog.create({
    data: {
      action: 'CREATE_ASSET',
      entityType: 'ASSET',
      entityId: asset1.id,
      userId: curator.id,
      metadata: { title: asset1.title },
      success: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: 'CREATE_COLLECTION',
      entityType: 'COLLECTION',
      entityId: collection1.id,
      userId: curator.id,
      metadata: { name: collection1.name },
      success: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: 'ADD_TAG',
      entityType: 'ASSET',
      entityId: asset1.id,
      userId: curator.id,
      metadata: { tagName: tagScultura.name },
      success: true,
    },
  });

  console.log('   ✓ Created 3 audit log entries');

  // Summary
  console.log('\n✅ Database seed completed successfully!\n');
  console.log('📊 Summary:');
  console.log('   • 4 users created (admin, curator, researcher, viewer)');
  console.log('   • 4 assets created');
  console.log('   • 4 free-form tags created');
  console.log('   • 5 ArCo tags created');
  console.log('   • 3 collections created');
  console.log('   • 7 ArCo vocabulary cache entries');
  console.log('   • 3 audit log entries');
  console.log('\n🔐 Test Credentials:');
  console.log('   Email: admin@culturalheritage.test');
  console.log('   Email: curator@culturalheritage.test');
  console.log('   Email: researcher@culturalheritage.test');
  console.log('   Email: viewer@culturalheritage.test');
  console.log('   Password (all): password123');
  console.log('\n🌐 Access the application at: http://localhost:3001\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
