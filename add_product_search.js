const fs = require('fs');
const path = 'app/components/header.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add import for getAllProducts + Product type
const oldImport = `import { getWishlistCount } from "@/lib/wishlist";
import { getCartCount } from "@/lib/cart";`;

const newImport = `import { getWishlistCount } from "@/lib/wishlist";
import { getCartCount } from "@/lib/cart";
import { getAllProducts, Product } from "@/lib/products";`;

if (!content.includes(oldImport)) { console.log('IMPORT BLOCK NOT FOUND'); process.exit(1); }
content = content.replace(oldImport, newImport);

// 2. Add products state + fetch on mount
const oldState = `  const [cartCount, setCartCount] = useState(0);`;
const newState = `  const [cartCount, setCartCount] = useState(0);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useEffect(() => {
    getAllProducts().then(setAllProducts);
  }, []);`;

if (!content.includes(oldState)) { console.log('STATE BLOCK NOT FOUND'); process.exit(1); }
content = content.replace(oldState, newState);

// 3. Add product filtering next to category filtering
const oldFilter = `  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );`;

const newFilter = `  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  const filteredProducts = query.trim()
    ? allProducts.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    : [];`;

if (!content.includes(oldFilter)) { console.log('FILTER BLOCK NOT FOUND'); process.exit(1); }
content = content.replace(oldFilter, newFilter);

// 4. Render product suggestions in the dropdown, above category suggestions
const oldDropdown = `              <div className="px-4 pt-3 pb-1 text-[11px] uppercase tracking-wider text-[#8A7F76]">
                Category Suggestions
              </div>`;

const newDropdown = `              {filteredProducts.length > 0 && (
                <>
                  <div className="px-4 pt-3 pb-1 text-[11px] uppercase tracking-wider text-[#8A7F76]">
                    Products
                  </div>
                  {filteredProducts.map((p) => (
                    <div
                      key={p._id}
                      onClick={() => {
                        router.push(\`/shop/\${p.category}/\${p._id}\`);
                        setIsOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#FAF3EC] transition-colors cursor-pointer"
                    >
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-9 h-9 rounded-md object-cover"
                      />
                      <span className="text-sm text-[#2B2420]">{p.name}</span>
                    </div>
                  ))}
                </>
              )}
              <div className="px-4 pt-3 pb-1 text-[11px] uppercase tracking-wider text-[#8A7F76]">
                Category Suggestions
              </div>`;

if (!content.includes(oldDropdown)) { console.log('DROPDOWN BLOCK NOT FOUND'); process.exit(1); }
content = content.replace(oldDropdown, newDropdown);

fs.writeFileSync(path, content);
console.log('Product suggestions added successfully.');
