const { PrismaClient } = require('./backend/node_modules/@prisma/client');

async function checkForFdsfTab() {
  const prisma = new PrismaClient();
  
  try {
    // Query the database for a tab with name "fdsf"
    const fdsfTab = await prisma.tab.findFirst({
      where: {
        name: 'fdsf'
      }
    });
    
    if (fdsfTab) {
      console.log('Found tab with name "fdsf":');
      console.log(JSON.stringify(fdsfTab, null, 2));
      return fdsfTab;
    } else {
      console.log('No tab with name "fdsf" found in the database');
      return null;
    }
  } catch (error) {
    console.error('Error querying database:', error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkForFdsfTab().then(tab => {
  if (tab) {
    console.log(`\nTo remove this tab, you can run: DELETE FROM tabs WHERE id = ${tab.id};`);
  }
});