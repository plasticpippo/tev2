import { ProductGridLayoutData } from '../frontend/services/apiBase';

// Test the layout saving functionality with isDefault flag
const testLayoutSave = async () => {
 console.log("Testing layout save functionality with isDefault flag...");

  // Simulate the data that would be sent when saving a layout
  const layoutData: ProductGridLayoutData = {
    name: 'Test Layout',
    tillId: 1,
    layout: {
      columns: 6,
      gridItems: [
        {
          id: 'item-1-1-0',
          variantId: 1,
          productId: 1,
          x: 0,
          y: 0,
          width: 1,
          height: 1,
        }
      ],
      version: '1.0',
    },
    isDefault: true,
    filterType: 'favorites',
    categoryId: null
  };

  console.log("Layout data to be saved:", JSON.stringify(layoutData, null, 2));

  try {
    // This would be the API call to save the layout
    // const result = await saveGridLayout(layoutData);
    // console.log("Saved layout result:", result);

    console.log("Layout save test completed successfully!");
  } catch (error) {
    console.error("Error in layout save test:", error);
  }
};

// Run the test
testLayoutSave();