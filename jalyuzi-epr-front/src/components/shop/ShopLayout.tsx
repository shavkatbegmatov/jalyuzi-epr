import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useShopStore } from '../../store/shopStore';
import { ShopCart } from './ShopCart';
import { LanguageSwitcher } from './LanguageSwitcher';

export function ShopLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const { cart, isCartOpen, setCartOpen, isAuthenticated, customer, logout } = useShopStore();

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-base-100">
      {/* Header */}
      <header className="navbar bg-primary text-primary-content sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto">
          {/* Logo */}
          <div className="flex-1">
            <Link to="/shop" className="btn btn-ghost text-xl font-bold">
              Jalyuzi
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex gap-2">
            <Link
              to="/shop"
              className={`btn btn-ghost btn-sm ${location.pathname === '/shop' ? 'btn-active' : ''}`}
            >
              {t('nav.home')}
            </Link>
            <Link
              to="/shop/catalog"
              className={`btn btn-ghost btn-sm ${location.pathname.startsWith('/shop/catalog') ? 'btn-active' : ''}`}
            >
              {t('shop.catalog')}
            </Link>
            <Link
              to="/shop/configurator"
              className={`btn btn-ghost btn-sm ${location.pathname === '/shop/configurator' ? 'btn-active' : ''}`}
            >
              {t('shop.configurator.title')}
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex-none gap-2">
            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Cart Button */}
            <button
              className="btn btn-ghost btn-circle"
              onClick={() => setCartOpen(true)}
            >
              <div className="indicator">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {cartItemsCount > 0 && (
                  <span className="badge badge-secondary badge-sm indicator-item">
                    {cartItemsCount}
                  </span>
                )}
              </div>
            </button>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="dropdown dropdown-end">
                <label tabIndex={0} className="btn btn-ghost btn-circle avatar placeholder">
                  <div className="bg-neutral text-neutral-content rounded-full w-10">
                    <span className="text-sm">
                      {customer?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                </label>
                <ul
                  tabIndex={0}
                  className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 text-base-content rounded-box w-52"
                >
                  <li className="menu-title">
                    <span>{customer?.fullName}</span>
                  </li>
                  <li>
                    <Link to="/shop/orders">{t('shop.orders.title')}</Link>
                  </li>
                  <li>
                    <Link to="/shop/profile">{t('nav.profile')}</Link>
                  </li>
                  <li>
                    <button onClick={logout}>{t('auth.logout')}</button>
                  </li>
                </ul>
              </div>
            ) : (
              <Link to="/shop/login" className="btn btn-ghost btn-sm">
                {t('auth.login')}
              </Link>
            )}

            {/* Mobile Menu */}
            <div className="dropdown dropdown-end md:hidden">
              <label tabIndex={0} className="btn btn-ghost btn-circle">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </label>
              <ul
                tabIndex={0}
                className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 text-base-content rounded-box w-52"
              >
                <li>
                  <Link to="/shop">{t('nav.home')}</Link>
                </li>
                <li>
                  <Link to="/shop/catalog">{t('shop.catalog')}</Link>
                </li>
                <li>
                  <Link to="/shop/configurator">{t('shop.configurator.title')}</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="footer footer-center p-10 bg-base-200 text-base-content">
        <div className="container mx-auto">
          <div className="grid grid-flow-col gap-4">
            <Link to="/shop" className="link link-hover">
              {t('nav.home')}
            </Link>
            <Link to="/shop/catalog" className="link link-hover">
              {t('shop.catalog')}
            </Link>
            <Link to="/shop/configurator" className="link link-hover">
              {t('shop.configurator.title')}
            </Link>
          </div>
          <div>
            <p>Copyright © 2024 - Jalyuzi ERP</p>
          </div>
        </div>
      </footer>

      {/* Cart Drawer */}
      <ShopCart isOpen={isCartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
