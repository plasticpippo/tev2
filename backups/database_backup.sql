--
-- PostgreSQL database dump
--

\restrict FLOF0jZpuHuJcNzdigAGL9EEJL7ZKCMM3fV98ZHR7FMFF341GxRUg71zu7kKNWv

-- Dumped from database version 15.15 (Debian 15.15-1.pgdg13+1)
-- Dumped by pg_dump version 15.15 (Debian 15.15-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: totalevo_user
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO totalevo_user;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: totalevo_user
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name text NOT NULL,
    "visibleTillIds" jsonb
);


ALTER TABLE public.categories OWNER TO totalevo_user;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: totalevo_user
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.categories_id_seq OWNER TO totalevo_user;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: totalevo_user
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: consumption_daily_summaries; Type: TABLE; Schema: public; Owner: totalevo_user
--

CREATE TABLE public.consumption_daily_summaries (
    id integer NOT NULL,
    variantid integer NOT NULL,
    closingdate date NOT NULL,
    totalquantity integer DEFAULT 0 NOT NULL,
    transactioncount integer DEFAULT 0 NOT NULL,
    dailyclosingid integer
);


ALTER TABLE public.consumption_daily_summaries OWNER TO totalevo_user;

--
-- Name: consumption_daily_summaries_id_seq; Type: SEQUENCE; Schema: public; Owner: totalevo_user
--

CREATE SEQUENCE public.consumption_daily_summaries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.consumption_daily_summaries_id_seq OWNER TO totalevo_user;

--
-- Name: consumption_daily_summaries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: totalevo_user
--

ALTER SEQUENCE public.consumption_daily_summaries_id_seq OWNED BY public.consumption_daily_summaries.id;


--
-- Name: consumption_monthly_summaries; Type: TABLE; Schema: public; Owner: totalevo_user
--

CREATE TABLE public.consumption_monthly_summaries (
    id integer NOT NULL,
    variantid integer NOT NULL,
    monthstart date NOT NULL,
    totalquantity integer DEFAULT 0 NOT NULL,
    transactioncount integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.consumption_monthly_summaries OWNER TO totalevo_user;

--
-- Name: consumption_monthly_summaries_id_seq; Type: SEQUENCE; Schema: public; Owner: totalevo_user
--

CREATE SEQUENCE public.consumption_monthly_summaries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.consumption_monthly_summaries_id_seq OWNER TO totalevo_user;

--
-- Name: consumption_monthly_summaries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: totalevo_user
--

ALTER SEQUENCE public.consumption_monthly_summaries_id_seq OWNED BY public.consumption_monthly_summaries.id;


--
-- Name: consumption_weekly_summaries; Type: TABLE; Schema: public; Owner: totalevo_user
--

CREATE TABLE public.consumption_weekly_summaries (
    id integer NOT NULL,
    variantid integer NOT NULL,
    weekstart date NOT NULL,
    totalquantity integer DEFAULT 0 NOT NULL,
    transactioncount integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.consumption_weekly_summaries OWNER TO totalevo_user;

--
-- Name: consumption_weekly_summaries_id_seq; Type: SEQUENCE; Schema: public; Owner: totalevo_user
--

CREATE SEQUENCE public.consumption_weekly_summaries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.consumption_weekly_summaries_id_seq OWNER TO totalevo_user;

--
-- Name: consumption_weekly_summaries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: totalevo_user
--

ALTER SEQUENCE public.consumption_weekly_summaries_id_seq OWNED BY public.consumption_weekly_summaries.id;


--
-- Name: daily_closings; Type: TABLE; Schema: public; Owner: totalevo_user
--

CREATE TABLE public.daily_closings (
    id integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "closedAt" timestamp(3) without time zone NOT NULL,
    summary jsonb NOT NULL,
    "userId" integer NOT NULL
);


ALTER TABLE public.daily_closings OWNER TO totalevo_user;

--
-- Name: daily_closings_id_seq; Type: SEQUENCE; Schema: public; Owner: totalevo_user
--

CREATE SEQUENCE public.daily_closings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.daily_closings_id_seq OWNER TO totalevo_user;

--
-- Name: daily_closings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: totalevo_user
--

ALTER SEQUENCE public.daily_closings_id_seq OWNED BY public.daily_closings.id;


--
-- Name: order_activity_logs; Type: TABLE; Schema: public; Owner: totalevo_user
--

CREATE TABLE public.order_activity_logs (
    id integer NOT NULL,
    action text NOT NULL,
    details jsonb NOT NULL,
    "userId" integer NOT NULL,
    "userName" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.order_activity_logs OWNER TO totalevo_user;

--
-- Name: order_activity_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: totalevo_user
--

CREATE SEQUENCE public.order_activity_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.order_activity_logs_id_seq OWNER TO totalevo_user;

--
-- Name: order_activity_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: totalevo_user
--

ALTER SEQUENCE public.order_activity_logs_id_seq OWNED BY public.order_activity_logs.id;


--
-- Name: order_sessions; Type: TABLE; Schema: public; Owner: totalevo_user
--

CREATE TABLE public.order_sessions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" integer NOT NULL,
    items jsonb NOT NULL,
    status text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "logoutTime" timestamp(3) without time zone
);


ALTER TABLE public.order_sessions OWNER TO totalevo_user;

--
-- Name: product_variants; Type: TABLE; Schema: public; Owner: totalevo_user
--

CREATE TABLE public.product_variants (
    id integer NOT NULL,
    "productId" integer NOT NULL,
    name text NOT NULL,
    price double precision NOT NULL,
    "isFavourite" boolean DEFAULT false,
    "backgroundColor" text NOT NULL,
    "textColor" text NOT NULL
);


ALTER TABLE public.product_variants OWNER TO totalevo_user;

--
-- Name: product_variants_id_seq; Type: SEQUENCE; Schema: public; Owner: totalevo_user
--

CREATE SEQUENCE public.product_variants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.product_variants_id_seq OWNER TO totalevo_user;

--
-- Name: product_variants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: totalevo_user
--

ALTER SEQUENCE public.product_variants_id_seq OWNED BY public.product_variants.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: totalevo_user
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name text NOT NULL,
    "categoryId" integer NOT NULL
);


ALTER TABLE public.products OWNER TO totalevo_user;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: totalevo_user
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.products_id_seq OWNER TO totalevo_user;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: totalevo_user
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: revoked_tokens; Type: TABLE; Schema: public; Owner: totalevo_user
--

CREATE TABLE public.revoked_tokens (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "tokenDigest" text NOT NULL,
    "userId" integer NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "revokedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.revoked_tokens OWNER TO totalevo_user;

--
-- Name: rooms; Type: TABLE; Schema: public; Owner: totalevo_user
--

CREATE TABLE public.rooms (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.rooms OWNER TO totalevo_user;

--
-- Name: settings; Type: TABLE; Schema: public; Owner: totalevo_user
--

CREATE TABLE public.settings (
    id integer NOT NULL,
    "taxMode" text NOT NULL,
    "autoStartTime" text NOT NULL,
    "lastManualClose" timestamp(3) without time zone,
    "businessDayEndHour" text DEFAULT '06:00'::text NOT NULL
);


ALTER TABLE public.settings OWNER TO totalevo_user;

--
-- Name: settings_id_seq; Type: SEQUENCE; Schema: public; Owner: totalevo_user
--

CREATE SEQUENCE public.settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.settings_id_seq OWNER TO totalevo_user;

--
-- Name: settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: totalevo_user
--

ALTER SEQUENCE public.settings_id_seq OWNED BY public.settings.id;


--
-- Name: shared_layout_positions; Type: TABLE; Schema: public; Owner: totalevo_user
--

CREATE TABLE public.shared_layout_positions (
    id integer NOT NULL,
    "sharedLayoutId" integer NOT NULL,
    "variantId" integer NOT NULL,
    "gridColumn" integer NOT NULL,
    "gridRow" integer NOT NULL
);


ALTER TABLE public.shared_layout_positions OWNER TO totalevo_user;

--
-- Name: shared_layout_positions_id_seq; Type: SEQUENCE; Schema: public; Owner: totalevo_user
--

CREATE SEQUENCE public.shared_layout_positions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.shared_layout_positions_id_seq OWNER TO totalevo_user;

--
-- Name: shared_layout_positions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: totalevo_user
--

ALTER SEQUENCE public.shared_layout_positions_id_seq OWNED BY public.shared_layout_positions.id;


--
-- Name: shared_layouts; Type: TABLE; Schema: public; Owner: totalevo_user
--

CREATE TABLE public.shared_layouts (
    id integer NOT NULL,
    name text NOT NULL,
    "categoryId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    owner_id integer
);


ALTER TABLE public.shared_layouts OWNER TO totalevo_user;

--
-- Name: shared_layouts_id_seq; Type: SEQUENCE; Schema: public; Owner: totalevo_user
--

CREATE SEQUENCE public.shared_layouts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.shared_layouts_id_seq OWNER TO totalevo_user;

--
-- Name: shared_layouts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: totalevo_user
--

ALTER SEQUENCE public.shared_layouts_id_seq OWNED BY public.shared_layouts.id;


--
-- Name: stock_adjustments; Type: TABLE; Schema: public; Owner: totalevo_user
--

CREATE TABLE public.stock_adjustments (
    id integer NOT NULL,
    "itemName" text NOT NULL,
    quantity integer NOT NULL,
    reason text NOT NULL,
    "userId" integer NOT NULL,
    "userName" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "stockItemId" uuid NOT NULL
);


ALTER TABLE public.stock_adjustments OWNER TO totalevo_user;

--
-- Name: stock_adjustments_id_seq; Type: SEQUENCE; Schema: public; Owner: totalevo_user
--

CREATE SEQUENCE public.stock_adjustments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.stock_adjustments_id_seq OWNER TO totalevo_user;

--
-- Name: stock_adjustments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: totalevo_user
--

ALTER SEQUENCE public.stock_adjustments_id_seq OWNED BY public.stock_adjustments.id;


--
-- Name: stock_consumptions; Type: TABLE; Schema: public; Owner: totalevo_user
--

CREATE TABLE public.stock_consumptions (
    id integer NOT NULL,
    "variantId" integer NOT NULL,
    quantity integer NOT NULL,
    "stockItemId" uuid NOT NULL
);


ALTER TABLE public.stock_consumptions OWNER TO totalevo_user;

--
-- Name: stock_consumptions_id_seq; Type: SEQUENCE; Schema: public; Owner: totalevo_user
--

CREATE SEQUENCE public.stock_consumptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.stock_consumptions_id_seq OWNER TO totalevo_user;

--
-- Name: stock_consumptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: totalevo_user
--

ALTER SEQUENCE public.stock_consumptions_id_seq OWNED BY public.stock_consumptions.id;


--
-- Name: stock_items; Type: TABLE; Schema: public; Owner: totalevo_user
--

CREATE TABLE public.stock_items (
    name text NOT NULL,
    quantity integer NOT NULL,
    type text NOT NULL,
    "baseUnit" text NOT NULL,
    "purchasingUnits" jsonb,
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL
);


ALTER TABLE public.stock_items OWNER TO totalevo_user;

--
-- Name: tables; Type: TABLE; Schema: public; Owner: totalevo_user
--

CREATE TABLE public.tables (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    x double precision DEFAULT 0 NOT NULL,
    y double precision DEFAULT 0 NOT NULL,
    width double precision DEFAULT 100 NOT NULL,
    height double precision DEFAULT 100 NOT NULL,
    status text DEFAULT 'available'::text NOT NULL,
    "roomId" uuid NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    items jsonb,
    capacity integer,
    owner_id integer
);


ALTER TABLE public.tables OWNER TO totalevo_user;

--
-- Name: tabs; Type: TABLE; Schema: public; Owner: totalevo_user
--

CREATE TABLE public.tabs (
    id integer NOT NULL,
    name text NOT NULL,
    items jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "tillId" integer NOT NULL,
    "tillName" text NOT NULL,
    "tableId" uuid
);


ALTER TABLE public.tabs OWNER TO totalevo_user;

--
-- Name: tabs_id_seq; Type: SEQUENCE; Schema: public; Owner: totalevo_user
--

CREATE SEQUENCE public.tabs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tabs_id_seq OWNER TO totalevo_user;

--
-- Name: tabs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: totalevo_user
--

ALTER SEQUENCE public.tabs_id_seq OWNED BY public.tabs.id;


--
-- Name: tills; Type: TABLE; Schema: public; Owner: totalevo_user
--

CREATE TABLE public.tills (
    id integer NOT NULL,
    name text NOT NULL
);


ALTER TABLE public.tills OWNER TO totalevo_user;

--
-- Name: tills_id_seq; Type: SEQUENCE; Schema: public; Owner: totalevo_user
--

CREATE SEQUENCE public.tills_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tills_id_seq OWNER TO totalevo_user;

--
-- Name: tills_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: totalevo_user
--

ALTER SEQUENCE public.tills_id_seq OWNED BY public.tills.id;


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: totalevo_user
--

CREATE TABLE public.transactions (
    id integer NOT NULL,
    items jsonb NOT NULL,
    subtotal double precision NOT NULL,
    tax double precision NOT NULL,
    tip double precision NOT NULL,
    total double precision NOT NULL,
    "paymentMethod" text NOT NULL,
    "userId" integer NOT NULL,
    "userName" text NOT NULL,
    "tillId" integer NOT NULL,
    "tillName" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    discount double precision DEFAULT 0 NOT NULL,
    "discountReason" text,
    status character varying(255) DEFAULT 'completed'::character varying NOT NULL
);


ALTER TABLE public.transactions OWNER TO totalevo_user;

--
-- Name: transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: totalevo_user
--

CREATE SEQUENCE public.transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.transactions_id_seq OWNER TO totalevo_user;

--
-- Name: transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: totalevo_user
--

ALTER SEQUENCE public.transactions_id_seq OWNED BY public.transactions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: totalevo_user
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name text NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    role text NOT NULL,
    "tokensRevokedAt" timestamp(3) without time zone
);


ALTER TABLE public.users OWNER TO totalevo_user;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: totalevo_user
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO totalevo_user;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: totalevo_user
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: variant_layouts; Type: TABLE; Schema: public; Owner: totalevo_user
--

CREATE TABLE public.variant_layouts (
    id integer NOT NULL,
    "tillId" integer NOT NULL,
    "categoryId" integer NOT NULL,
    "variantId" integer NOT NULL,
    "gridColumn" integer NOT NULL,
    "gridRow" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    owner_id integer
);


ALTER TABLE public.variant_layouts OWNER TO totalevo_user;

--
-- Name: variant_layouts_id_seq; Type: SEQUENCE; Schema: public; Owner: totalevo_user
--

CREATE SEQUENCE public.variant_layouts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.variant_layouts_id_seq OWNER TO totalevo_user;

--
-- Name: variant_layouts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: totalevo_user
--

ALTER SEQUENCE public.variant_layouts_id_seq OWNED BY public.variant_layouts.id;


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: consumption_daily_summaries id; Type: DEFAULT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.consumption_daily_summaries ALTER COLUMN id SET DEFAULT nextval('public.consumption_daily_summaries_id_seq'::regclass);


--
-- Name: consumption_monthly_summaries id; Type: DEFAULT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.consumption_monthly_summaries ALTER COLUMN id SET DEFAULT nextval('public.consumption_monthly_summaries_id_seq'::regclass);


--
-- Name: consumption_weekly_summaries id; Type: DEFAULT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.consumption_weekly_summaries ALTER COLUMN id SET DEFAULT nextval('public.consumption_weekly_summaries_id_seq'::regclass);


--
-- Name: daily_closings id; Type: DEFAULT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.daily_closings ALTER COLUMN id SET DEFAULT nextval('public.daily_closings_id_seq'::regclass);


--
-- Name: order_activity_logs id; Type: DEFAULT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.order_activity_logs ALTER COLUMN id SET DEFAULT nextval('public.order_activity_logs_id_seq'::regclass);


--
-- Name: product_variants id; Type: DEFAULT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.product_variants ALTER COLUMN id SET DEFAULT nextval('public.product_variants_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: settings id; Type: DEFAULT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.settings ALTER COLUMN id SET DEFAULT nextval('public.settings_id_seq'::regclass);


--
-- Name: shared_layout_positions id; Type: DEFAULT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.shared_layout_positions ALTER COLUMN id SET DEFAULT nextval('public.shared_layout_positions_id_seq'::regclass);


--
-- Name: shared_layouts id; Type: DEFAULT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.shared_layouts ALTER COLUMN id SET DEFAULT nextval('public.shared_layouts_id_seq'::regclass);


--
-- Name: stock_adjustments id; Type: DEFAULT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.stock_adjustments ALTER COLUMN id SET DEFAULT nextval('public.stock_adjustments_id_seq'::regclass);


--
-- Name: stock_consumptions id; Type: DEFAULT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.stock_consumptions ALTER COLUMN id SET DEFAULT nextval('public.stock_consumptions_id_seq'::regclass);


--
-- Name: tabs id; Type: DEFAULT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.tabs ALTER COLUMN id SET DEFAULT nextval('public.tabs_id_seq'::regclass);


--
-- Name: tills id; Type: DEFAULT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.tills ALTER COLUMN id SET DEFAULT nextval('public.tills_id_seq'::regclass);


--
-- Name: transactions id; Type: DEFAULT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.transactions ALTER COLUMN id SET DEFAULT nextval('public.transactions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: variant_layouts id; Type: DEFAULT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.variant_layouts ALTER COLUMN id SET DEFAULT nextval('public.variant_layouts_id_seq'::regclass);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: totalevo_user
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
c9d125f4-37e6-4fa5-b2a8-5ae7f086be6a	10da085f282d413c9355a4dd52a529b81bd8e9dd7be87b81fd17ac8c631c0fa7	2025-12-30 17:08:29.06332+00	20251030152931_init	\N	\N	2025-12-30 17:08:27.944359+00	1
d4920c78-f4ee-4b06-b947-3bfa6ca8f143	cca258f9b8b2b03bf5638a416f71decfa0549fe30ee646dca7c7c00ad64dab17	2025-12-30 17:08:29.430175+00	20251103223600_stock_items_uuid	\N	\N	2025-12-30 17:08:29.080966+00	1
31480437-392b-43ae-ac98-5b6bf035935e	61df96cbcd44605e655be43d4d79e6d503730fe420447c50b54e77fc5b0f54cd	2025-12-30 17:08:29.571174+00	20251104113759_add_order_session_table	\N	\N	2025-12-30 17:08:29.449195+00	1
2efbc42d-164e-4ddc-a560-178378a1d594	399c93f1cbde04ea689f6f468efa27997a3530a0ffcec55954a432bd0bd5c3db	2025-12-30 17:08:29.847059+00	20251104171000_add_tables_and_rooms	\N	\N	2025-12-30 17:08:29.585185+00	1
7f2cd322-f6e1-448e-9530-b5afefec35cb	a5168c1a26a458ae828555a15b379876174241c97f0a8ad5e2ada2866fd289f3	2025-12-30 17:08:30.008629+00	2025111212853_add_daily_closings	\N	\N	2025-12-30 17:08:29.859204+00	1
996c80d6-651c-431a-8dcb-2cfe28c56a2d	18b49a62883408d6f2bc2bf0336f5c83dc0d47f85b209ae424f21aaa073b6600	2025-12-30 17:08:30.225773+00	20251114102600_add_product_grid_layouts	\N	\N	2025-12-30 17:08:30.021545+00	1
033073c7-d258-4c38-a378-ec93f388151c	94b0a88e4a9fe89fd4b3608e45d68eb87c8d7b910f2daf223b516cd7ea682c71	2025-12-30 17:08:30.378179+00	20251114180200_add_filter_type_and_category_to_grid_layouts	\N	\N	2025-12-30 17:08:30.239559+00	1
98f1e00a-53e6-4c71-9935-e245e19fcd7d	20f428f531bd9b9a2b918d306be83885fd62849635e9d551ef028b316ac41f9f	2025-12-30 17:08:30.434764+00	20251114181400_set_default_filter_type_for_existing_layouts	\N	\N	2025-12-30 17:08:30.390578+00	1
ed119616-caf8-464f-af4b-53072d97d115	cb4825f4c149f74fd437d609aed8cc56de12ac5d853a89e1b72285cb557cb9e6	2025-12-30 17:08:30.47898+00	20251212180000_add_special_categories_for_layouts	\N	\N	2025-12-30 17:08:30.445831+00	1
0501163a-51d8-4ae4-be8a-b9cff6872cdf	faab54be80133d75069bd62b139bbc69a2c5e49fb07d8d032275f542b1c8314f	2025-12-30 17:08:30.560186+00	20251213070000_set_visible_till_ids_default	\N	\N	2025-12-30 17:08:30.487644+00	1
4efb1907-a172-4a75-83d9-a461ca589365	9064576c075eeb62091fa998f8d6e359e2b7c9582854969c5465b4d80554838a	2026-01-13 20:05:53.301807+00	20260113200552_add_consumption_aggregates	\N	\N	2026-01-13 20:05:53.072363+00	1
a2627618-3aa2-496c-8edb-bf876c4082cd	7a466731dd30918dbd49276f508a35f9cf9b15e0b4132f7fce1bb5c76dc26b89	2026-02-10 18:56:21.177608+00	20260117190000_add_items_column_to_tables	\N	\N	2026-02-10 18:56:20.936848+00	1
3e34dd0a-14dc-4669-ae01-2ebf60e312cb	27c5aca998d42b5963abea770e6adbd3ae5473a6aafb1554a94ebf43ae784844	\N	20260117215000_add_shared_column_to_grid_layouts	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260117215000_add_shared_column_to_grid_layouts\n\nDatabase error code: 42701\n\nDatabase error:\nERROR: column "shared" of relation "product_grid_layouts" already exists\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42701), message: "column \\"shared\\" of relation \\"product_grid_layouts\\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("tablecmds.c"), line: Some(7279), routine: Some("check_for_column_name_collision") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20260117215000_add_shared_column_to_grid_layouts"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106\n   1: schema_core::commands::apply_migrations::Applying migration\n           with migration_name="20260117215000_add_shared_column_to_grid_layouts"\n             at schema-engine/core/src/commands/apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:226	2026-02-10 20:11:27.789372+00	2026-02-10 18:56:21.194957+00	0
568d8f9c-0ffb-47c4-a9f0-b4c27488438b	a894f5996afc26c32dd40b2ee1113af5bd1920a656e3e9c0143cbdda90a32785	2026-02-10 20:12:54.978036+00	20260126181418_add_variant_layout_tables	\N	\N	2026-02-10 20:12:54.160402+00	1
932831af-6594-450a-b044-b596f09169f7	27c5aca998d42b5963abea770e6adbd3ae5473a6aafb1554a94ebf43ae784844	\N	20260117215000_add_shared_column_to_grid_layouts	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260117215000_add_shared_column_to_grid_layouts\n\nDatabase error code: 42701\n\nDatabase error:\nERROR: column "shared" of relation "product_grid_layouts" already exists\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42701), message: "column \\"shared\\" of relation \\"product_grid_layouts\\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("tablecmds.c"), line: Some(7279), routine: Some("check_for_column_name_collision") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20260117215000_add_shared_column_to_grid_layouts"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106\n   1: schema_core::commands::apply_migrations::Applying migration\n           with migration_name="20260117215000_add_shared_column_to_grid_layouts"\n             at schema-engine/core/src/commands/apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:226	2026-02-10 20:12:36.326761+00	2026-02-10 20:12:08.876528+00	0
4f640074-7177-448e-b13e-a1677082e4d7	27c5aca998d42b5963abea770e6adbd3ae5473a6aafb1554a94ebf43ae784844	2026-02-10 20:12:36.349623+00	20260117215000_add_shared_column_to_grid_layouts		\N	2026-02-10 20:12:36.349623+00	0
ad673058-01f5-4fd2-adb3-412507592259	c0b1d0a9c6da328c5b827ad038992e9e5f2c4b4f086a94eeba99966f6de1d555	2026-02-10 20:12:54.14098+00	20260120140000_drop_product_grid_layouts	\N	\N	2026-02-10 20:12:53.768366+00	1
a390674f-415b-49f8-b01b-3ee658ded9bc	4ff7a1219690fe8e8fc1371272c23d744e41c3aad9dff5e0c2ac5d2de82b4ec9	2026-02-10 20:12:55.047149+00	20260129120000_add_capacity_to_tables	\N	\N	2026-02-10 20:12:54.994399+00	1
426ac0b9-dc7b-4431-b280-2cdae6823e0f	e58a74c6684bb8af58f831fb1a858549ff43476b92a7cff26f47d13a62974f95	2026-02-16 18:32:45.7256+00	20260215120000_add_discount_fields_to_transactions	\N	\N	2026-02-16 18:32:45.007335+00	1
1f29d502-bfdc-4799-98e3-dc4453ae40dd	01fe02f3812f34b8528ddc3cf24905623a3c75eb54cd6c9d75f39d96b5fd3211	2026-02-10 20:12:55.326676+00	20260130040000_add_ownership_fields	\N	\N	2026-02-10 20:12:55.061353+00	1
85e84aca-62e6-4918-b28f-70964ca9c5f5	66c1064f00d4647d65697238a1247c7bb38d8fede795a730c3e2afe5d9d5029d	2026-02-10 20:12:55.403657+00	20260207145238_rename_password_hack_to_password	\N	\N	2026-02-10 20:12:55.342589+00	1
c29aff97-75bc-4521-851a-965688fe4227	52e9dc9bba530b6df7ff1d8bf3892626f197babb29d2528fc036cd409455a227	2026-02-10 20:12:55.788768+00	20260207160000_add_token_blacklist	\N	\N	2026-02-10 20:12:55.422615+00	1
d93499f1-7d0c-4804-b128-19fcb2149635	a8445faff0c4fd3b2a0028534468f2b8947e10e5eb868e8279c684a1f47cdd08	2026-02-10 20:12:55.847082+00	20260207170000_add_tokens_revoked_at_to_users	\N	\N	2026-02-10 20:12:55.802588+00	1
6aa6f68a-fbc7-4aec-a76e-44ba401c39a6	5753da67ccb9ab1fb081113b46966093926f945f312ccf04c5291a2b72cf7191	2026-02-10 21:07:43.837806+00	20260210210000_drop_category_fk_from_layouts	\N	\N	2026-02-10 21:07:43.537971+00	1
365fcdf3-e66a-4afc-b294-c401099076b9	9b3ecb52a32f0d3c501b8ca6240ed15d81f075fcbc9a5fd3fb566d1d736e2e3a	2026-02-20 22:15:00.17234+00	20260219120000_add_transaction_createdat_index	\N	\N	2026-02-20 22:14:59.541751+00	1
e640b40e-f13a-4018-8302-4ed94a802070	6ca0d06b491aeb102e998eceda37df067d44f0db764ee566cdb7e705d2bcd82f	2026-02-20 22:15:00.375305+00	20260219130000_add_business_day_end_hour	\N	\N	2026-02-20 22:15:00.190965+00	1
79f8a34c-5305-49f5-8f6f-c3b98931231e	a9309543e6369e80a3151c88034079ae2a4356a720a0ad21bc6bb5ea9e711269	2026-02-20 22:15:00.573561+00	20260220000000_normalize_payment_methods	\N	\N	2026-02-20 22:15:00.389976+00	1
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: totalevo_user
--

COPY public.categories (id, name, "visibleTillIds") FROM stdin;
80	white wine	"[65]"
83	Bibite	"[65]"
84	Entrata	"[64]"
86	F&F	"[65]"
81	Beer	"[1,65]"
85	Shots	"[65]"
82	Cocktails	"[65]"
\.


--
-- Data for Name: consumption_daily_summaries; Type: TABLE DATA; Schema: public; Owner: totalevo_user
--

COPY public.consumption_daily_summaries (id, variantid, closingdate, totalquantity, transactioncount, dailyclosingid) FROM stdin;
3	116	2026-01-13	330	1	\N
5	119	2026-01-13	210	2	\N
6	127	2026-01-13	120	2	\N
7	128	2026-01-13	150	1	\N
8	129	2026-01-13	750	1	\N
9	131	2026-01-13	1	1	\N
13	137	2026-01-13	210	2	\N
14	138	2026-01-13	210	2	\N
\.


--
-- Data for Name: consumption_monthly_summaries; Type: TABLE DATA; Schema: public; Owner: totalevo_user
--

COPY public.consumption_monthly_summaries (id, variantid, monthstart, totalquantity, transactioncount) FROM stdin;
3	116	2026-01-01	330	1
5	119	2026-01-01	210	2
6	127	2026-01-01	120	2
7	128	2026-01-01	150	1
8	129	2026-01-01	750	1
9	131	2026-01-01	1	1
13	137	2026-01-01	210	2
14	138	2026-01-01	210	2
\.


--
-- Data for Name: consumption_weekly_summaries; Type: TABLE DATA; Schema: public; Owner: totalevo_user
--

COPY public.consumption_weekly_summaries (id, variantid, weekstart, totalquantity, transactioncount) FROM stdin;
3	116	2026-01-11	330	1
5	119	2026-01-11	210	2
6	127	2026-01-11	120	2
7	128	2026-01-11	150	1
8	129	2026-01-11	750	1
9	131	2026-01-11	1	1
13	137	2026-01-11	210	2
14	138	2026-01-11	210	2
\.


--
-- Data for Name: daily_closings; Type: TABLE DATA; Schema: public; Owner: totalevo_user
--

COPY public.daily_closings (id, "createdAt", "closedAt", summary, "userId") FROM stdin;
1	2026-02-14 21:21:50.752	2026-02-14 21:21:50.119	{"tills": {"64-Cassa": {"total": 96, "transactions": 1}}, "totalTax": 0, "totalTips": 0, "totalSales": 96, "transactions": 1, "paymentMethods": {"CARD": {"count": 1, "total": 96}}}	66
2	2026-02-16 09:57:53.138	2026-02-16 09:57:53.056	{"tills": {}, "totalTax": 0, "totalTips": 0, "totalSales": 0, "transactions": 0, "paymentMethods": {}}	66
\.


--
-- Data for Name: order_activity_logs; Type: TABLE DATA; Schema: public; Owner: totalevo_user
--

COPY public.order_activity_logs (id, action, details, "userId", "userName", "createdAt") FROM stdin;
4	Item Removed	"1 x Biglietto - Standard"	65	Cassa	2025-12-31 18:33:31.94
5	Item Removed	"1 x Tessera - Standard"	65	Cassa	2025-12-31 18:33:32.753
6	Item Removed	"1 x Gin & Tonic - Standard"	67	Bar	2025-12-31 18:52:59.195
7	Item Removed	"1 x Vodka Lemon - Standard"	67	Bar	2025-12-31 18:52:59.609
8	Item Removed	"1 x Vodka & Tonic - Normale"	67	Bar	2025-12-31 18:53:00.082
9	Item Removed	"1 x Vodka Shot - Standard"	67	Bar	2026-01-01 00:07:46.53
10	Item Removed	"1 x Biglietto - Standard"	65	Cassa	2026-01-01 00:21:38.471
11	Item Removed	"1 x Vodka & Tonic - Normale"	67	Bar	2026-01-01 02:20:26.637
12	Item Removed	"1 x Vodka & Tonic - Normale"	67	Bar	2026-01-01 02:20:27.048
13	Order Cleared	"[{\\"id\\":\\"0e573fef-2753-4c6e-bcea-36233a1ae3f3\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1,\\"effectiveTaxRate\\":0},{\\"id\\":\\"a767da50-9345-4ec0-bb9b-ae1557137f2f\\",\\"variantId\\":134,\\"productId\\":95,\\"name\\":\\"Vodka Shot - Standard\\",\\"price\\":3,\\"quantity\\":1,\\"effectiveTaxRate\\":0},{\\"id\\":\\"e469ecab-f2d5-4b20-9c71-bea21c9fe48f\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":4,\\"effectiveTaxRate\\":0},{\\"id\\":\\"8488229a-d056-40a4-a8c9-4ae7e9cb12a0\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0},{\\"id\\":\\"37e32447-b2c4-4a9b-ad02-51d6f6a42cd3\\",\\"variantId\\":137,\\"productId\\":97,\\"name\\":\\"Sipsmith Tonica - Standard\\",\\"price\\":12,\\"quantity\\":2,\\"effectiveTaxRate\\":0}]"	67	Bar	2026-01-23 17:05:29.268
14	Order Cleared	"[{\\"id\\":\\"74973007-63c8-4171-83cf-4142ac4b420c\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":5,\\"effectiveTaxRate\\":0},{\\"id\\":\\"ce0f9497-f0f7-485b-bb88-c53782019ccd\\",\\"variantId\\":134,\\"productId\\":95,\\"name\\":\\"Vodka Shot - Standard\\",\\"price\\":3,\\"quantity\\":10,\\"effectiveTaxRate\\":0},{\\"id\\":\\"b5224ab5-1f8c-40d1-b850-4af61fe5e2b7\\",\\"variantId\\":115,\\"productId\\":87,\\"name\\":\\"Tonica - Standard\\",\\"price\\":3,\\"quantity\\":1,\\"effectiveTaxRate\\":0},{\\"id\\":\\"7221ff64-8a66-479a-b746-041a2b473c0d\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":3,\\"effectiveTaxRate\\":0},{\\"id\\":\\"30169206-a2ae-4253-ab52-dc78df61fbc4\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0},{\\"id\\":\\"8047e400-571d-473d-8bf1-e4a894c58665\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":3,\\"effectiveTaxRate\\":0},{\\"id\\":\\"6300523a-6351-4653-8976-2e536dd37c84\\",\\"variantId\\":127,\\"productId\\":86,\\"name\\":\\"Pirlo Campari - Standard\\",\\"price\\":5,\\"quantity\\":1,\\"effectiveTaxRate\\":0}]"	65	Cassa	2026-01-23 17:08:54.928
15	Item Removed	"1 x Gin & Tonic - Standard"	67	Bar	2026-01-24 21:28:23.459
16	Item Removed	"1 x Vodka & Tonic - Normale"	67	Bar	2026-01-24 21:29:07.104
17	Item Removed	"1 x Vodka & Tonic - Normale"	67	Bar	2026-01-24 21:29:07.309
18	Item Removed	"1 x Biglietto - Standard"	65	Cassa	2026-01-24 21:48:28.354
19	Item Removed	"1 x Birra Wuhrer - Bottle"	67	Bar	2026-01-24 22:07:38.185
20	Item Removed	"1 x Gin & Tonic - Standard"	67	Bar	2026-01-24 23:45:06.015
21	Item Removed	"1 x Gin & Tonic - Standard"	67	Bar	2026-01-24 23:52:07.554
22	Item Removed	"1 x Gin & Tonic - Standard"	67	Bar	2026-01-24 23:52:08.306
23	Item Removed	"1 x Gin & Tonic - Standard"	67	Bar	2026-01-24 23:52:09.87
24	Item Removed	"1 x Birra Wuhrer - Bottle"	67	Bar	2026-01-31 22:56:01.152
25	Item Removed	"1 x Birra Wuhrer - Bottle"	67	Bar	2026-01-31 22:56:01.608
26	Item Removed	"1 x Hierbas Shot FF - Standard"	66	Admin User	2026-02-14 20:44:57.466
27	Item Removed	"1 x Acqua Nat - Standard"	66	Admin User	2026-02-15 17:42:20.23
28	Item Removed	"1 x Vodka & Tonic - Normale"	66	Admin User	2026-02-15 17:59:13.845
29	Item Removed	"1 x Biglietto - Standard"	65	Cassa	2026-02-15 17:59:37.407
30	Item Removed	"1 x Biglietto - Standard"	65	Cassa	2026-02-15 17:59:37.683
31	Item Removed	"1 x Biglietto - Standard"	65	Cassa	2026-02-15 17:59:37.904
32	Item Removed	"1 x Biglietto - Standard"	65	Cassa	2026-02-15 17:59:38.502
33	Item Removed	"1 x Tessera - Standard"	65	Cassa	2026-02-15 17:59:39.116
34	Item Removed	"1 x Biglietto - Standard"	65	Cassa	2026-02-15 18:17:24.118
35	Item Removed	"1 x Birra Wuhrer - Bottle"	66	Admin User	2026-02-15 20:07:03.868
36	Item Removed	"1 x Biglietto - Standard"	65	Cassa	2026-02-15 20:07:46.245
37	Item Removed	"1 x Gin & Tonic - Standard"	66	Admin User	2026-02-15 20:07:55.594
38	Item Removed	"1 x Birra Wuhrer - Bottle"	66	Admin User	2026-02-15 21:16:53.779
39	Item Removed	"1 x Biglietto - Standard"	66	Admin User	2026-02-15 21:22:28.308
40	Item Removed	"1 x Vodka & Tonic - Normale"	66	Admin User	2026-02-20 22:16:42.194
\.


--
-- Data for Name: order_sessions; Type: TABLE DATA; Schema: public; Owner: totalevo_user
--

COPY public.order_sessions (id, "userId", items, status, "createdAt", "updatedAt", "logoutTime") FROM stdin;
6ecb0f88-b83b-4d76-bf75-af40819e1b8d	66	"[{\\"id\\":\\"0e872eb9-4caf-476c-87c9-900d2ba5e81f\\",\\"variantId\\":150,\\"productId\\":93,\\"name\\":\\"Gin Lemon - Standard\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2025-12-31 21:42:54.055	2026-02-15 17:26:01.874	\N
1a07eadf-e3ea-4fb2-bf49-2b9ad6d9497e	67	"[{\\"id\\":\\"5377e53d-67cb-4f2c-87ab-f78a795e785a\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1},{\\"id\\":\\"b5224ab5-1f8c-40d1-b850-4af61fe5e2b7\\",\\"variantId\\":115,\\"productId\\":87,\\"name\\":\\"Tonica - Standard\\",\\"price\\":3,\\"quantity\\":1}]"	completed	2025-12-31 23:38:06.883	2025-12-31 23:39:04.954	\N
ebaef87b-f080-4a7d-958f-6c9e81ac5f0a	66	"[{\\"id\\":\\"426a8082-1651-4bf3-9f1b-8dcbd2e78833\\",\\"variantId\\":149,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":6,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	completed	2025-12-31 20:49:51.041	2026-02-14 23:58:57.295	\N
f8abc692-26fd-4326-903b-6ac374b44236	66	"[{\\"id\\":\\"97028b71-c55b-4ad4-a3e7-1038f10518b9\\",\\"variantId\\":160,\\"productId\\":110,\\"name\\":\\"Wuhrer FF - Standard\\",\\"price\\":4,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2025-12-31 20:49:51.065	2026-02-15 01:01:21.304	\N
22a087ad-4a91-4b17-bd91-d1470998e094	65	"[{\\"id\\":\\"fce82998-d574-4e53-90d9-9e768aebd1f7\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":2},{\\"id\\":\\"78ffe214-838a-4b8e-82ff-098ffd3f5265\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":4}]"	completed	2025-12-31 22:04:42.908	2025-12-31 23:35:53.998	\N
0f604528-0c3a-44b1-9f6e-a8161f0a9e64	67	"[{\\"id\\":\\"5c3c0aae-3a2c-4f18-aaeb-59180a493711\\",\\"variantId\\":115,\\"productId\\":87,\\"name\\":\\"Tonica - Standard\\",\\"price\\":3,\\"quantity\\":2}]"	completed	2026-01-01 00:08:45.926	2026-01-01 00:11:13.236	\N
e77e4fe7-0877-4127-879f-fd3106862ece	67	"[{\\"id\\":\\"a767da50-9345-4ec0-bb9b-ae1557137f2f\\",\\"variantId\\":134,\\"productId\\":95,\\"name\\":\\"Vodka Shot - Standard\\",\\"price\\":3,\\"quantity\\":1}]"	completed	2026-01-01 00:03:53.53	2026-01-01 00:07:16.154	\N
47adb8b3-4e49-4980-894b-d7cc513e0eae	67	"[{\\"id\\":\\"a615b353-8f90-458c-b1e5-45a6c563bba0\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1},{\\"id\\":\\"c0644ccf-9c95-4ffc-85f0-efe1733f5909\\",\\"variantId\\":127,\\"productId\\":86,\\"name\\":\\"Pirlo Campari - Standard\\",\\"price\\":5,\\"quantity\\":1}]"	completed	2025-12-31 23:20:54.363	2025-12-31 23:37:43.834	\N
3b597ac8-6a4f-4b08-bf79-9d829931f972	67	"[]"	completed	2025-12-31 18:51:17.97	2025-12-31 20:29:29.348	\N
e08ea59d-851c-4018-b205-b2e64a295538	65	"[{\\"id\\":\\"675cce8d-166b-4fdd-bb35-0299555fa192\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"d9b2a259-03b5-4fd9-a6a9-bc15dc216e21\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	completed	2025-12-31 18:33:05.984	2026-02-15 17:43:22.413	\N
e8f821c2-3961-4af8-94b8-05313643204f	66	"[{\\"id\\":\\"f358335e-3652-4628-bb17-0fc11f688382\\",\\"variantId\\":159,\\"productId\\":109,\\"name\\":\\"Becks FF - Standard\\",\\"price\\":3,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2025-12-31 18:10:34.989	2026-02-15 03:59:07.983	\N
d935a980-af3e-46ce-b80e-62335fcefa00	67	"[{\\"id\\":\\"8b89f17c-8010-4e1a-85c6-0d144e70fa6a\\",\\"variantId\\":132,\\"productId\\":93,\\"name\\":\\"Gin Lemon - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	completed	2025-12-31 22:00:49.552	2025-12-31 22:24:58.674	\N
27fa1a5f-c728-4b46-bf97-e2ac35d3fdfe	65	"[{\\"id\\":\\"d9106136-39bb-48c9-9fac-497837c767c4\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"47ff565b-d91b-4ee1-afb5-dabd0a78a321\\",\\"variantId\\":133,\\"productId\\":94,\\"name\\":\\"Gratis - Standard\\",\\"price\\":0.1,\\"quantity\\":1}]"	completed	2025-12-31 23:35:54.04	2025-12-31 23:43:50.27	\N
bb3336c4-9709-43e6-8efd-96d3242cdd2e	67	"[{\\"id\\":\\"ce0f9497-f0f7-485b-bb88-c53782019ccd\\",\\"variantId\\":134,\\"productId\\":95,\\"name\\":\\"Vodka Shot - Standard\\",\\"price\\":3,\\"quantity\\":1}]"	completed	2025-12-31 22:24:58.749	2025-12-31 22:30:34.522	\N
041f7960-f159-480d-9d34-aa52d0715922	65	"[{\\"id\\":\\"6e238ce3-511a-4c7a-a8d8-b19a8bce47b1\\",\\"variantId\\":164,\\"productId\\":94,\\"name\\":\\"Gratis - Standard\\",\\"price\\":0,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2025-12-31 22:04:42.89	2026-02-15 17:29:52.158	\N
60bc555c-c896-4f69-8032-05fb9922904d	67	"[{\\"id\\":\\"b5f7c13e-c8a6-47fb-bb7a-13d317057e64\\",\\"variantId\\":115,\\"productId\\":87,\\"name\\":\\"Tonica - Standard\\",\\"price\\":3,\\"quantity\\":1}]"	completed	2025-12-31 23:37:43.928	2025-12-31 23:38:06.82	\N
d393afe2-bc7e-4812-9444-24b28fcf7172	67	"[{\\"id\\":\\"6e88ad28-8de7-41b2-9ef7-810b823ccd46\\",\\"variantId\\":134,\\"productId\\":95,\\"name\\":\\"Vodka Shot - Standard\\",\\"price\\":3,\\"quantity\\":1}]"	completed	2025-12-31 22:30:34.587	2025-12-31 22:42:15.338	\N
a267e701-8c22-4fb0-ad9b-d02cdb7f54ec	67	"[{\\"id\\":\\"33e7c4b5-c071-40e4-863a-0fa11a2551b1\\",\\"variantId\\":132,\\"productId\\":93,\\"name\\":\\"Gin Lemon - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	completed	2025-12-31 22:42:15.401	2025-12-31 22:45:15.606	\N
ac407ce8-978f-4b93-8222-940a0df66b7b	65	"[]"	completed	2025-12-31 21:44:54.396	2025-12-31 21:48:10.579	\N
a3798020-538a-4a60-8437-18ff71b52e3c	67	"[{\\"id\\":\\"17c7831e-3a9e-4fa5-a007-a8625da86330\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1}]"	completed	2025-12-31 18:51:17.954	2025-12-31 22:00:49.475	\N
602e62a0-b34d-4a50-8eb4-a3e7d1fca251	67	"[{\\"id\\":\\"0e573fef-2753-4c6e-bcea-36233a1ae3f3\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1}]"	completed	2025-12-31 23:39:05.003	2026-01-01 00:03:53.457	\N
3d1d434b-0dfa-4573-a274-e94da9bea38f	67	"[{\\"id\\":\\"3e2e4ddd-e862-4076-8a44-74d531ec2020\\",\\"variantId\\":137,\\"productId\\":97,\\"name\\":\\"Sipsmith Tonica - Standard\\",\\"price\\":12,\\"quantity\\":1}]"	completed	2025-12-31 22:45:15.665	2025-12-31 23:20:54.272	\N
d9fac3a1-f2a4-42e5-83a4-8b62a14fea49	65	"[{\\"id\\":\\"e357ebde-759c-4579-aded-5c31b96b90e2\\",\\"variantId\\":133,\\"productId\\":94,\\"name\\":\\"Gratis - Standard\\",\\"price\\":0.1,\\"quantity\\":1},{\\"id\\":\\"6dd13536-7c99-45c6-be58-01bc5a7dab0b\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":3},{\\"id\\":\\"ea3748fb-0164-498c-9291-0c2a4a56d386\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":4}]"	completed	2025-12-31 23:43:50.318	2026-01-01 00:15:35.177	\N
2a998a02-09fe-487d-a276-64049395df48	67	"[{\\"id\\":\\"2b74554c-d5a0-4032-afea-eb00d80db251\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1}]"	completed	2026-01-01 00:07:16.212	2026-01-01 00:08:45.873	\N
f57807a7-9442-4e46-ac74-93c74a971f72	67	"[{\\"id\\":\\"5800d649-b1a2-4da6-b390-f64cdf054d7b\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":2}]"	completed	2026-01-01 00:11:13.313	2026-01-01 00:18:00.056	\N
06e3a398-2f84-4ed7-8fed-19c1e79151a3	65	"[{\\"id\\":\\"4831a6c6-1fd8-41a7-a167-2a043555fbf4\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"3533ddfc-cc51-4d36-9538-60a213b04675\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	completed	2026-01-01 00:15:35.221	2026-01-01 00:21:01.294	\N
687520e9-bfc2-49fd-bab8-2ad3324d241a	65	"[{\\"id\\":\\"b629d798-dccb-408b-bd4a-f1528d3375dd\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"4a796d1a-3197-441b-a2f1-7748cdbb50d9\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	completed	2026-01-01 00:21:01.335	2026-01-01 00:25:20.434	\N
d46bbbe1-a2d7-4313-81ee-f337963d4332	67	"[{\\"id\\":\\"92347468-1ee6-47cc-9bea-5b5e5b800cd2\\",\\"variantId\\":134,\\"productId\\":95,\\"name\\":\\"Vodka Shot - Standard\\",\\"price\\":3,\\"quantity\\":1}]"	completed	2026-01-01 00:18:00.225	2026-01-01 00:27:28.912	\N
11cb08de-3390-4c8d-a9b4-8da985cdb3d6	65	"[{\\"id\\":\\"9a82f13e-c5c6-487b-bdfc-04f563935780\\",\\"variantId\\":133,\\"productId\\":94,\\"name\\":\\"Gratis - Standard\\",\\"price\\":0.1,\\"quantity\\":1}]"	completed	2026-01-01 00:25:20.479	2026-01-01 00:25:57.741	\N
7bfa5651-e36f-4571-8a23-dccfabe423b4	67	"[{\\"id\\":\\"56d2a423-85dc-4bc7-8162-1e30b57c839c\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":2},{\\"id\\":\\"6d80c9c2-7c72-4dae-822c-0d6e333ad9ff\\",\\"variantId\\":132,\\"productId\\":93,\\"name\\":\\"Gin Lemon - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	completed	2026-01-01 01:18:44.5	2026-01-01 01:19:50.579	\N
2d5606fc-67c0-4257-a24e-43b376d51418	65	"[{\\"id\\":\\"49711b0e-5c34-4bdc-9a6f-561beef1eec1\\",\\"variantId\\":133,\\"productId\\":94,\\"name\\":\\"Gratis - Standard\\",\\"price\\":0.1,\\"quantity\\":1}]"	completed	2026-01-01 00:25:57.792	2026-01-01 00:27:01.943	\N
7a540cdd-ca17-45e0-b45d-0f3b00348e91	67	"[{\\"id\\":\\"044f8f3f-8002-48e4-bac6-2ea7fe91feb7\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1}]"	completed	2026-01-01 01:01:59.234	2026-01-01 01:07:31.173	\N
20319a19-ae75-48a6-9c07-fca39fa6ac20	67	"[{\\"id\\":\\"fb735d8c-620d-4c09-928c-6696a9b6afb8\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":1},{\\"id\\":\\"1333c772-e47d-4acc-97e9-385e17170be5\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	completed	2026-01-01 00:27:28.981	2026-01-01 00:31:59.167	\N
4d535283-df12-46c1-848e-f836cc74c926	67	"[{\\"id\\":\\"7aabd676-4bcf-46b4-aca1-53dbbe0161cd\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":1}]"	completed	2026-01-01 00:31:59.253	2026-01-01 00:33:16.755	\N
ea46c8dd-db16-4818-9b2b-e2ba169f7b42	65	"[{\\"id\\":\\"1f2c199e-e773-4ba5-aa2e-669ebdb8cbcc\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	completed	2026-01-01 00:54:02.72	2026-01-01 01:13:27.769	\N
25a87901-05a1-4c90-ade3-dcd69c9b2811	67	"[{\\"id\\":\\"76519f64-8f43-4fc0-8067-479d4db10fcd\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1}]"	completed	2026-01-01 00:33:16.827	2026-01-01 00:46:08.597	\N
95f725bd-f139-46b5-aa27-0313993f3a9a	67	"[{\\"id\\":\\"0f18463e-aa39-49de-b4b2-442c5fe1843d\\",\\"variantId\\":127,\\"productId\\":86,\\"name\\":\\"Pirlo Campari - Standard\\",\\"price\\":5,\\"quantity\\":1}]"	completed	2026-01-01 00:46:08.675	2026-01-01 00:47:35.793	\N
016d1b33-796a-4af4-bccc-b9337ff8e23f	67	"[{\\"id\\":\\"8488229a-d056-40a4-a8c9-4ae7e9cb12a0\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1},{\\"id\\":\\"37e32447-b2c4-4a9b-ad02-51d6f6a42cd3\\",\\"variantId\\":137,\\"productId\\":97,\\"name\\":\\"Sipsmith Tonica - Standard\\",\\"price\\":12,\\"quantity\\":1}]"	completed	2026-01-01 01:23:45.027	2026-01-01 01:27:31.5	\N
fd4a2c88-7f31-42ed-9af1-a286d3cc0f6a	67	"[{\\"id\\":\\"23ddd86f-5fac-4d37-9dd6-3beda497b6d6\\",\\"variantId\\":134,\\"productId\\":95,\\"name\\":\\"Vodka Shot - Standard\\",\\"price\\":3,\\"quantity\\":5}]"	completed	2026-01-01 01:07:31.24	2026-01-01 01:18:44.444	\N
471d43fb-fba9-42b0-b6fc-1c4cfa71a216	67	"[{\\"id\\":\\"7221ff64-8a66-479a-b746-041a2b473c0d\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":2}]"	completed	2026-01-01 00:47:35.848	2026-01-01 00:53:02.417	\N
000db720-83ab-4fea-a34e-a9591d5ea591	67	"[{\\"id\\":\\"e469ecab-f2d5-4b20-9c71-bea21c9fe48f\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1}]"	completed	2026-01-01 00:53:02.478	2026-01-01 00:53:16.717	\N
f34a137c-b869-48c7-ba58-76dd62a8f39c	67	"[{\\"id\\":\\"8047e400-571d-473d-8bf1-e4a894c58665\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":2}]"	completed	2026-01-01 01:19:50.673	2026-01-01 01:23:44.977	\N
379ad3a5-316e-4d86-be6a-b9f487ffef18	65	"[{\\"id\\":\\"4c27e59b-be87-4fc8-915f-179adf07d1f4\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	completed	2026-01-01 00:27:01.986	2026-01-01 00:53:56.997	\N
47eb3070-3606-4b46-a53e-69f0e0147a31	65	"[{\\"id\\":\\"c5cac6b7-8e3d-4a00-b40b-e04ae2b3b899\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	completed	2026-01-01 00:53:57.053	2026-01-01 00:54:02.675	\N
e542601d-f44d-4a62-9da8-0d97c76e2d2f	67	"[{\\"id\\":\\"7cb78712-f0c3-4671-8bfa-22a699421259\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1}]"	completed	2026-01-01 00:53:16.775	2026-01-01 00:58:41.526	\N
bbf6b48d-2159-4501-8059-806aaf4f3a64	65	"[{\\"id\\":\\"f86fdc55-52b9-46e7-89f5-1a9d38e25bc5\\",\\"variantId\\":133,\\"productId\\":94,\\"name\\":\\"Gratis - Standard\\",\\"price\\":0.1,\\"quantity\\":2},{\\"id\\":\\"72c11192-fae3-4cf5-94cb-2c19e84e4e5b\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	completed	2026-01-01 01:35:18.243	2026-01-01 01:39:30.993	\N
2005fb43-31a8-4197-a7e9-4ad269f46374	67	"[{\\"id\\":\\"af99ee18-465c-43c5-8543-a8fc3d7ecce3\\",\\"variantId\\":132,\\"productId\\":93,\\"name\\":\\"Gin Lemon - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	completed	2026-01-01 00:58:41.575	2026-01-01 01:00:54.507	\N
e02bc7c8-a9c5-4e88-8ff3-09462dcb9b7d	67	"[{\\"id\\":\\"0fb5f70c-9c0b-4a03-97fb-87e6c6a4f5dd\\",\\"variantId\\":137,\\"productId\\":97,\\"name\\":\\"Sipsmith Tonica - Standard\\",\\"price\\":12,\\"quantity\\":1}]"	completed	2026-01-01 01:27:31.558	2026-01-01 01:27:36.616	\N
033f9cb1-0a68-46db-87e1-3fa8d6cfa92a	67	"[{\\"id\\":\\"30169206-a2ae-4253-ab52-dc78df61fbc4\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":1}]"	completed	2026-01-01 01:00:54.578	2026-01-01 01:01:59.171	\N
947168ef-e9e3-4cea-a761-922224b969b4	65	"[{\\"id\\":\\"cef2c475-bd10-4be3-9b65-bfc649948ba0\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":2},{\\"id\\":\\"03b92107-0a80-466b-8ab4-d237fee64842\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":2}]"	completed	2026-01-01 01:13:27.817	2026-01-01 01:19:34.012	\N
6d4326f6-1beb-40f6-b1fc-8abe8adcfe6c	65	"[{\\"id\\":\\"6c9c92f7-2af8-4b36-b34b-55f58b056a11\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	completed	2026-01-01 01:19:34.056	2026-01-01 01:19:46.786	\N
9cb79e77-d5e5-41f9-b504-da28e8894f35	65	"[{\\"id\\":\\"b25f9dfc-0937-48ee-b6a8-6547fd1fb105\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"f82efafa-a580-4474-a4b6-9f5efc4df995\\",\\"variantId\\":133,\\"productId\\":94,\\"name\\":\\"Gratis - Standard\\",\\"price\\":0.1,\\"quantity\\":1}]"	completed	2026-01-01 01:19:46.829	2026-01-01 01:26:43.719	\N
1373d0c9-1156-478b-8053-4eff840ad854	65	"[{\\"id\\":\\"ceedc478-faf0-4e10-8609-0a307d6f5f84\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"579582b9-a4f2-4a1e-8bf1-5dc59548076e\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	completed	2026-01-01 01:26:43.759	2026-01-01 01:35:18.2	\N
92271923-c0cb-45f3-b0f9-21320140d434	67	"[{\\"id\\":\\"6300523a-6351-4653-8976-2e536dd37c84\\",\\"variantId\\":127,\\"productId\\":86,\\"name\\":\\"Pirlo Campari - Standard\\",\\"price\\":5,\\"quantity\\":1}]"	completed	2026-01-01 01:27:36.675	2026-01-01 01:34:49.173	\N
35401cf4-0754-4cd1-9f7d-a8132d4b684f	67	"[{\\"id\\":\\"c96d633f-eed8-4b4c-a166-001af25881f0\\",\\"variantId\\":132,\\"productId\\":93,\\"name\\":\\"Gin Lemon - Standard\\",\\"price\\":8,\\"quantity\\":1},{\\"id\\":\\"a126cd5e-bf77-4e7e-83a9-4ca79358aed3\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1}]"	completed	2026-01-01 01:34:49.24	2026-01-01 01:42:51.888	\N
fa292ffb-292e-4e77-9cef-025bde4a42e7	67	"[{\\"id\\":\\"0aa6b312-66a3-45d8-9000-cf9669daf24d\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1},{\\"id\\":\\"cddd3b34-e765-48ad-9fc5-1e5cfcc99b9e\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	completed	2026-01-01 01:42:51.966	2026-01-01 01:42:59.589	\N
7f46b9d3-2d6a-4b64-b5f2-877e2477f105	67	"[{\\"id\\":\\"572ca598-dee9-4a65-9cd4-e887b89ae3e9\\",\\"variantId\\":132,\\"productId\\":93,\\"name\\":\\"Gin Lemon - Standard\\",\\"price\\":8,\\"quantity\\":2}]"	completed	2026-01-01 01:42:59.654	2026-01-01 01:50:15.647	\N
7172ff10-0efc-42dd-9a96-48178c844e23	67	"[{\\"id\\":\\"b597dca9-5dd2-43bd-92f1-9531d722689b\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":1}]"	completed	2026-01-01 02:28:50.497	2026-01-01 02:31:56.802	\N
08abc851-edb8-449c-b299-07a05129d608	67	"[{\\"id\\":\\"06951a8d-17fd-4a0e-ad30-f17c799d1f9f\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":1}]"	completed	2026-01-01 02:31:56.881	2026-01-01 02:32:03.938	\N
83c98bcf-def6-43c8-a9d1-7adbc0e52f19	65	"[{\\"id\\":\\"5d0eebfa-c38d-41bd-9e67-029ae93c980b\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"8850eb4a-6691-463b-9c66-057870b414f6\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	completed	2026-01-01 01:39:31.039	2026-01-01 01:45:08.708	\N
6a4de503-b778-4b71-a07a-09fc4d527e1f	65	"[{\\"id\\":\\"63993265-f6bb-479c-8184-46e411442828\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"2b378570-8aac-4128-9310-9c2512c36a66\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	completed	2026-01-01 01:59:01.821	2026-01-01 01:59:12.771	\N
53245ca5-5d70-4197-9424-df4b3c4d5ac4	67	"[{\\"id\\":\\"6c94ca77-be3b-438b-a8dd-69ec611f45de\\",\\"variantId\\":132,\\"productId\\":93,\\"name\\":\\"Gin Lemon - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	completed	2026-01-01 01:50:15.736	2026-01-01 01:50:20.618	\N
a35ce04f-cb32-497a-9a4d-c7744fcc9b2f	67	"[{\\"id\\":\\"e270e918-0d7a-4b51-8326-aa44e54cb897\\",\\"variantId\\":134,\\"productId\\":95,\\"name\\":\\"Vodka Shot - Standard\\",\\"price\\":3,\\"quantity\\":3}]"	completed	2026-01-01 01:59:00.536	2026-01-01 01:59:21.634	\N
c34858b8-644e-4a43-a759-d4d9c1d285cc	65	"[{\\"id\\":\\"9718b246-c757-40a8-ad66-2b97e1e91544\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"fa23b9e7-e9d8-46db-8b59-a022911aa2f3\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	completed	2026-01-01 01:45:08.757	2026-01-01 01:51:02.558	\N
42120214-5ecc-48d5-97fb-de8c805ba96b	65	"[{\\"id\\":\\"0e543759-6974-48eb-958e-b5a51bd07d06\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"02f2e3dd-80a5-4898-9eaf-27c5e0a47b9f\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	completed	2026-01-01 02:06:16.601	2026-01-01 02:08:53.557	\N
a1b528cf-06d2-44e3-bec4-032d90b455cb	65	"[{\\"id\\":\\"97f740ec-c814-49e0-88a6-a5779da810b2\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"0bfcf492-ccd7-495c-a87c-ac9afc062904\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	completed	2026-01-01 01:51:02.597	2026-01-01 01:54:07.805	\N
69648b3c-3556-4090-b2bb-2d9a22150ef0	67	"[{\\"id\\":\\"eb9b8266-ddcf-44e4-a4f5-8aa555caaaa6\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	completed	2026-01-01 01:50:20.678	2026-01-01 01:55:29.494	\N
b0134f70-1a63-4be5-b819-fed3a55ac065	65	"[{\\"id\\":\\"f138f4f3-d852-468d-bbd3-431d1b614e8f\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"7e4cb287-a07c-45c5-90f1-ff42f5a6d8f1\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	completed	2026-01-01 01:59:12.818	2026-01-01 02:05:21.134	\N
d26f5330-3846-4cd0-84b3-b80142b04012	67	"[{\\"id\\":\\"2b4f1103-3272-4e59-bb8b-ac079503446e\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	completed	2026-01-01 01:55:29.58	2026-01-01 01:55:39.726	\N
d13c033e-0e14-4f16-8b6d-32722f8a82c2	67	"[{\\"id\\":\\"ff74d197-cffa-4348-8dd1-1bdb8fcad6eb\\",\\"variantId\\":132,\\"productId\\":93,\\"name\\":\\"Gin Lemon - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	completed	2026-01-01 01:55:39.777	2026-01-01 01:56:33.392	\N
b99df7a3-a4cb-419f-a296-4bff0ce23ded	65	"[{\\"id\\":\\"70757cf3-e873-4911-b5c2-981607a42210\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"c97adafb-b08a-4536-9482-f4ca17cf6f6c\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	completed	2026-01-01 02:05:21.185	2026-01-01 02:06:16.563	\N
a494c2f4-db12-49ac-803a-c1c5447a4dd0	67	"[{\\"id\\":\\"b5c4164d-16b8-4d2b-8b1f-df639198d27b\\",\\"variantId\\":132,\\"productId\\":93,\\"name\\":\\"Gin Lemon - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	completed	2026-01-01 01:56:33.499	2026-01-01 01:59:00.437	\N
7359a3fa-a48f-467f-8d26-6bdec218e239	65	"[{\\"id\\":\\"b3b2202c-a642-4e67-b49b-f1ba6c36fe71\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"ddf3d37c-3341-49bc-a3d6-ffad7bfb0222\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	completed	2026-01-01 01:54:07.865	2026-01-01 01:59:01.775	\N
231b63b4-f3d6-411f-b013-57b3c9348d7a	65	"[{\\"id\\":\\"66d55913-0ae7-439f-b58b-03b2dd9c46c4\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"cc898c03-2d47-4767-b538-0b9773c6596b\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	completed	2026-01-01 02:08:53.602	2026-01-01 02:09:22.966	\N
ad469d39-16eb-405a-b5c7-bc3f4da1d912	67	"[{\\"id\\":\\"dd1b9378-6c91-4a7e-b471-b7891321094e\\",\\"variantId\\":132,\\"productId\\":93,\\"name\\":\\"Gin Lemon - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	completed	2026-01-01 01:59:21.697	2026-01-01 02:07:39.116	\N
96c53d16-c465-4445-b12c-2f5c6228faa2	67	"[{\\"id\\":\\"f8a50d50-5006-4285-8365-e2d38f2b5464\\",\\"variantId\\":132,\\"productId\\":93,\\"name\\":\\"Gin Lemon - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	completed	2026-01-01 02:10:44.264	2026-01-01 02:11:55.002	\N
c1f6f420-2bba-4634-ade6-a5afb7a578f4	67	"[{\\"id\\":\\"6ef1fec7-1584-4850-a926-c13517e6a656\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	completed	2026-01-01 02:07:39.188	2026-01-01 02:08:10.742	\N
7df7bc27-11ae-496f-9833-1a493d6b5dd1	65	"[{\\"id\\":\\"cbf43328-262e-4ecf-98e3-4fe2c1f8b099\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"2b04b2ae-0754-4cd1-ba85-d26d31080407\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	completed	2026-01-01 02:09:23.009	2026-01-01 02:10:36.694	\N
a0ac6074-353c-4fef-b3c2-63af61d4fba1	67	"[{\\"id\\":\\"24f6b452-2480-424e-abce-0b7a9d8e470b\\",\\"variantId\\":132,\\"productId\\":93,\\"name\\":\\"Gin Lemon - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	completed	2026-01-01 02:11:55.061	2026-01-01 02:12:00.455	\N
ff61ecf4-3085-473b-8c02-a01281f131dd	67	"[{\\"id\\":\\"f9668e48-d15b-453b-939a-60f2f6e6d9ac\\",\\"variantId\\":132,\\"productId\\":93,\\"name\\":\\"Gin Lemon - Standard\\",\\"price\\":8,\\"quantity\\":2}]"	completed	2026-01-01 02:08:10.789	2026-01-01 02:10:44.198	\N
a99a6ab9-bf94-4f99-a522-9fd647af2fc6	67	"[{\\"id\\":\\"0aa94e13-9bee-4961-9c3a-7141665b0d26\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":1}]"	completed	2026-01-01 02:12:00.503	2026-01-01 02:13:47.464	\N
4e5dea0c-436f-46cb-b176-eea75814fe48	65	"[{\\"id\\":\\"edb7509e-4f3b-4c44-ae3b-617f39d1b175\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"abeb3837-05cd-4b2c-b702-d2269a61c409\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	completed	2026-01-01 02:10:36.731	2026-01-01 02:12:43.81	\N
75231541-ca48-44c9-8a0b-953ff5d24587	67	"[{\\"id\\":\\"4ab151ad-a348-482f-b84a-9c5aaaa8ed9f\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	completed	2026-01-01 02:13:47.507	2026-01-01 02:17:31.27	\N
278af2d7-a8a9-40b3-bff5-4b69a51e3c8c	67	"[{\\"id\\":\\"a7c61de6-de35-45de-bd8b-84748d30b014\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":4}]"	completed	2026-01-01 02:17:31.537	2026-01-01 02:21:35.367	\N
0ab40435-40ab-4691-b195-d69100fd3762	67	"[{\\"id\\":\\"3bcbf362-dc3c-4fee-955f-ee2a22d08c48\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1}]"	completed	2026-01-01 02:21:35.441	2026-01-01 02:23:37.716	\N
bbd8ab16-1678-4218-9448-e59a9f96b8c9	67	"[{\\"id\\":\\"70c4a305-89bd-4bbd-81fd-250169c8809e\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	completed	2026-01-01 02:23:37.793	2026-01-01 02:23:59.326	\N
45a4632a-586a-4697-b928-ccf5535c290a	67	"[{\\"id\\":\\"5c297a39-e1e7-4583-847d-fb3a73889dd3\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1}]"	completed	2026-01-01 02:23:59.564	2026-01-01 02:28:50.432	\N
3cbd0205-fd97-4b91-8d4f-22ab676ba7b3	67	"[{\\"id\\":\\"6c2181c9-8768-4716-9cae-f7d00deeddb3\\",\\"variantId\\":132,\\"productId\\":93,\\"name\\":\\"Gin Lemon - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	completed	2026-01-01 02:32:04.007	2026-01-01 02:36:25.607	\N
06ce2027-793e-4eb7-8a29-70b4984c0224	67	"[{\\"id\\":\\"8a36fb24-a23d-434d-8a9b-bed427ccac81\\",\\"variantId\\":135,\\"productId\\":96,\\"name\\":\\"Hierbas Shot - Standard\\",\\"price\\":3,\\"quantity\\":3}]"	completed	2026-01-24 23:52:20.719	2026-01-24 23:56:38.807	\N
0b026aad-e1b0-48bb-ae38-349eb2b15435	67	"[{\\"id\\":\\"c5be0b67-8fd1-440d-97ef-d9a6b357df0b\\",\\"variantId\\":134,\\"productId\\":95,\\"name\\":\\"Vodka Shot - Standard\\",\\"price\\":3,\\"quantity\\":2}]"	completed	2026-01-01 02:36:25.677	2026-01-01 02:39:26.827	\N
107d1300-35eb-4c0a-8a79-a47ee6bf62ff	67	"[{\\"id\\":\\"cfc04c91-c0a0-4802-8219-9f44df008f00\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1}]"	completed	2026-01-01 02:39:26.901	2026-01-01 02:40:45.006	\N
6f255b77-07f9-45d6-9372-49691f760c3c	67	"[{\\"id\\":\\"00fc1d21-2125-44cb-963a-06d3f2380ac1\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	completed	2026-01-24 23:56:38.903	2026-01-25 00:02:34.562	\N
14a57f94-bfcd-4cdd-b175-b5cb86176897	67	"[{\\"id\\":\\"b3272d58-1acd-4f45-9f5f-8576a14e0ee2\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1}]"	completed	2026-01-01 02:40:45.072	2026-01-01 02:44:53.543	\N
2bd51b27-920a-434b-96e0-a65a086a6089	67	"[{\\"id\\":\\"179b14b9-b101-42ec-bd79-f994ef0a3e5c\\",\\"variantId\\":132,\\"productId\\":93,\\"name\\":\\"Gin Lemon - Standard\\",\\"price\\":8,\\"quantity\\":1},{\\"id\\":\\"b543c036-f492-4402-9fcb-96c89365cf47\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1}]"	completed	2026-01-01 02:44:53.637	2026-01-01 02:53:48.817	\N
560d01b3-4bd2-44f5-a3ec-88ac7b9f6014	67	"[{\\"id\\":\\"f85fd321-c33a-4337-8077-1f5d49661880\\",\\"variantId\\":135,\\"productId\\":96,\\"name\\":\\"Hierbas Shot - Standard\\",\\"price\\":3,\\"quantity\\":4}]"	completed	2026-01-25 00:02:34.638	2026-01-25 00:10:01.148	\N
c2f7f7d7-6f08-4356-8154-900bc4f4acf9	65	"[]"	completed	2026-01-23 16:46:09.416	2026-01-23 16:58:58.329	\N
64e24668-5ad4-48e9-9d31-175bf2f8755b	66	"[{\\"id\\":\\"fbd4ed0b-9a44-4cc9-b869-61af65543b05\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"7a52fbbe-f84b-4c0a-b8c4-b8ebb5889b73\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	completed	2025-12-31 23:20:09.722	2026-01-23 17:10:47.116	\N
93250550-71ed-4cc7-9c57-9b13a54cbfed	67	"[{\\"id\\":\\"460696cc-50d3-4246-b100-7e07ac350b9c\\",\\"variantId\\":134,\\"productId\\":95,\\"name\\":\\"Vodka Shot - Standard\\",\\"price\\":3,\\"quantity\\":1}]"	completed	2026-01-24 23:27:22.62	2026-01-24 23:27:33.314	\N
68d35174-ebec-406a-bdc7-ff1d9177f6a0	67	"[{\\"id\\":\\"6c2993fb-ccdc-4153-9987-c387d6fe65a1\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1}]"	completed	2026-01-25 00:10:01.277	2026-01-25 00:10:14.231	\N
a47ee33b-054a-4677-b429-98317ca73d14	67	"[{\\"id\\":\\"52094709-64ca-4d61-8f61-c11212e39f07\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1}]"	completed	2026-01-24 23:27:33.518	2026-01-24 23:42:28.244	\N
2a2490db-21c0-4862-90b5-9bc08fa6353d	67	"[{\\"id\\":\\"63f88a34-5b76-4cbc-98ce-2c3737a10ff0\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1}]"	completed	2026-01-25 00:10:14.506	2026-01-25 00:14:35.826	\N
ed86694a-8cc5-4c74-8a63-b946acf87b92	67	"[{\\"id\\":\\"8b3df07c-96ac-4f6b-9512-7d5e6326b9a5\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1},{\\"id\\":\\"726662a8-1b1d-40ec-bad8-8981933255e2\\",\\"variantId\\":128,\\"productId\\":84,\\"name\\":\\"Vino Bianco - Glass (150ml)\\",\\"price\\":5,\\"quantity\\":1}]"	completed	2026-01-31 22:31:44.061	2026-01-31 22:56:08.273	\N
b9db308b-e308-4fa7-9b92-f786dbaa5202	67	"[{\\"id\\":\\"133e0c52-8585-4099-b752-09f2f2b3d825\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":2}]"	completed	2026-01-25 00:14:35.981	2026-01-25 00:50:53.317	\N
d319b711-46f7-47fc-8444-a346a9875dc2	67	"[{\\"id\\":\\"51005452-ddbc-4476-9a94-44ee529d63ac\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1}]"	completed	2026-01-25 00:50:53.5	2026-01-25 00:53:37.54	\N
9c10cc78-12c7-4381-8388-36ec82a405fa	67	"[{\\"id\\":\\"fa182ef2-9e1f-4fbd-8fe8-12ad89bfb689\\",\\"variantId\\":137,\\"productId\\":97,\\"name\\":\\"Sipsmith Tonica - Standard\\",\\"price\\":12,\\"quantity\\":1}]"	completed	2026-01-24 23:42:28.71	2026-01-24 23:52:20.432	\N
e15151c4-767d-4047-a29e-9195b4489d17	67	"[{\\"id\\":\\"9633c5ef-6e57-496c-b638-dee882509514\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1},{\\"id\\":\\"fb5fe2bc-23b7-474e-b22c-f9183650c2b8\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":2}]"	completed	2026-01-31 22:21:50.598	2026-01-31 22:31:43.778	\N
cf8172f8-427d-497b-a72c-dd7908da5525	66	"[{\\"id\\":\\"c8488518-1bc2-4448-8f78-d88e06af6062\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":2},{\\"id\\":\\"4e7fdd19-0ec8-44dc-a5a5-6b79091e3995\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	completed	2026-01-31 22:17:09.687	2026-01-31 22:17:19.688	\N
39cc91ed-4a3a-43f9-b48c-6e6755f25f70	67	"[{\\"id\\":\\"f432c99d-f5b7-425e-9c14-65a7b48d4df5\\",\\"variantId\\":134,\\"productId\\":95,\\"name\\":\\"Vodka Shot - Standard\\",\\"price\\":3,\\"quantity\\":2}]"	completed	2026-01-25 00:53:38.173	2026-01-25 01:05:07.312	\N
682e5040-2749-4e21-b53a-5b831abc904b	67	"[{\\"id\\":\\"7d9c9cf3-1ad2-4b33-8c35-a129c22f8c41\\",\\"variantId\\":135,\\"productId\\":96,\\"name\\":\\"Hierbas Shot - Standard\\",\\"price\\":3,\\"quantity\\":1}]"	completed	2026-01-25 01:05:07.406	2026-01-25 01:05:14.879	\N
7bbdd5f0-7cb4-4d5a-80a9-6572463d85e3	66	"[{\\"id\\":\\"6265b7fd-720a-48be-ad2a-506552fd2e8b\\",\\"variantId\\":133,\\"productId\\":94,\\"name\\":\\"Gratis - Standard\\",\\"price\\":0.1,\\"quantity\\":2}]"	completed	2026-01-23 17:10:47.157	2026-01-31 22:17:09.6	\N
86afb8db-e66f-4dd4-8b7b-faa3ded3bbbf	66	"[{\\"id\\":\\"361df239-826a-4721-8e1b-b2d4f82e2b58\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"79f18056-b0a3-4ba3-9942-24ffb937c97c\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":2}]"	completed	2026-01-31 22:32:19.966	2026-01-31 22:47:08.386	\N
164cfc1e-a22c-403e-8e1b-d7ceb2a4da36	66	"[{\\"id\\":\\"fdcacbd8-ccd4-4cc6-9386-1672e19d8353\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	completed	2026-01-31 22:17:19.744	2026-01-31 22:20:02.814	\N
14c8e0e8-b8da-4b70-b731-cd63a4dc1b8a	66	"[{\\"id\\":\\"f6460fec-95dc-47b4-81bd-86a352413149\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":2}]"	completed	2026-01-31 22:20:02.88	2026-01-31 22:32:19.909	\N
7d02b279-f281-4f5d-9489-faed2c53a750	67	"[{\\"id\\":\\"c6b68a64-409f-4cf2-98a7-991e8d36eef1\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1},{\\"id\\":\\"6cbf5300-955f-4706-8d30-a54cb4479401\\",\\"variantId\\":141,\\"productId\\":99,\\"name\\":\\"VT - Standard\\",\\"price\\":5,\\"quantity\\":1}]"	completed	2026-01-25 01:05:14.976	2026-01-31 22:21:49.795	\N
18a74f93-d13b-4289-b879-7a4516b079ac	67	"[{\\"id\\":\\"c50da524-e673-4c51-9290-036cea3f1d80\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1}]"	completed	2026-01-31 22:56:08.401	2026-01-31 23:07:30.151	\N
7793d165-4d49-4a0a-a157-366a4d068e0e	67	"[{\\"id\\":\\"1aa4dc55-d14d-4fdd-aa52-6b4e0f9022f2\\",\\"variantId\\":134,\\"productId\\":95,\\"name\\":\\"Vodka Shot - Standard\\",\\"price\\":3,\\"quantity\\":2}]"	completed	2026-01-31 23:07:30.244	2026-01-31 23:08:00.83	\N
f397f2bf-b4eb-4440-9a44-4c3a66451b80	66	"[{\\"id\\":\\"7b3f456e-81d8-45b4-9807-ccaa1de03ac1\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":2},{\\"id\\":\\"9c745e05-9e48-44f1-b673-c00c5b7fb4b9\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":2}]"	completed	2026-01-31 22:47:08.47	2026-01-31 23:10:06.725	\N
d392d9a6-46cf-4187-8965-e390e3987a4a	65	"[{\\"id\\":\\"25511676-8bb0-439c-84ab-9dcc38fecb14\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	completed	2026-01-23 16:46:09.434	2026-02-15 18:02:49.654	\N
232b349c-507e-4fec-bcd7-6cfa985c1219	65	"[{\\"id\\":\\"ebbcb548-cbdf-40e9-9682-65a8ca5d3846\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"4fb0c7d2-73fc-4fc8-8b42-5b502157ae7c\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":2}]"	completed	2026-01-24 21:48:32.009	2026-01-24 22:11:20.922	\N
f8bc6031-12c2-4c41-9ead-e360f6c2587a	67	"[{\\"id\\":\\"392964b7-2e28-4bc7-98a1-f2d2d3ea3934\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1}]"	completed	2026-01-01 02:53:48.882	2026-01-24 21:30:50.042	\N
d4e6d15f-c7d8-43b4-abd5-d643be75fb1e	67	"[{\\"id\\":\\"e3ad4c2c-a7f1-440e-b8b0-bb77da528c93\\",\\"variantId\\":127,\\"productId\\":86,\\"name\\":\\"Pirlo Campari - Standard\\",\\"price\\":5,\\"quantity\\":2}]"	completed	2026-01-24 22:27:41.913	2026-01-24 22:36:31.214	\N
028c8cff-dfd3-4bdb-8d4d-8a8a7317ffe6	65	"[{\\"id\\":\\"912a984f-e920-4fbe-9baa-480a035730a2\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	completed	2026-01-23 17:25:30.979	2026-01-24 19:31:15.13	\N
2c550f22-7a5e-4eb8-9da6-a7c54714f07c	67	"[{\\"id\\":\\"a76f294d-58d0-4dd1-bfe2-09841b487902\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1},{\\"id\\":\\"3348b818-f84b-41c2-b584-31916b5d9369\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1}]"	completed	2026-01-24 21:43:57.329	2026-01-24 22:12:30.434	\N
ecb54a8a-6241-49b3-a21f-000fee10059a	67	"[{\\"id\\":\\"21d70d8f-b416-4849-a363-d3b54db7a848\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	completed	2026-01-24 22:41:55.643	2026-01-24 22:45:43.969	\N
e251fd73-00ff-4513-9fc8-2e9a230957a2	65	"[{\\"id\\":\\"21388ade-8b67-411d-a464-612b515e72cb\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"56593332-8a24-403a-81ce-67a106149f82\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":3}]"	completed	2026-01-24 19:31:15.194	2026-01-24 21:10:56.786	\N
efe56f69-11f3-489f-ab7d-0f51467c081b	67	"[{\\"id\\":\\"7a1a84c1-66cf-4ca0-8a49-5c184314d9a2\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1}]"	completed	2026-01-24 22:12:30.707	2026-01-24 22:12:51.478	\N
0fd8a198-19fe-4959-a7c8-3ea6c3d17e6f	65	"[{\\"id\\":\\"389eb0f1-2c4d-4dc4-95ae-963015689119\\",\\"variantId\\":133,\\"productId\\":94,\\"name\\":\\"Gratis - Standard\\",\\"price\\":0.1,\\"quantity\\":2}]"	completed	2026-01-24 21:10:56.827	2026-01-24 21:11:06.271	\N
25862b5c-138f-4912-8e32-ed9b86013734	67	"[{\\"id\\":\\"7f0a1b03-b71a-4d77-ae94-95bb336df73e\\",\\"variantId\\":116,\\"productId\\":88,\\"name\\":\\"Lemonsoda - Standard\\",\\"price\\":3,\\"quantity\\":1}]"	completed	2026-01-24 21:30:50.549	2026-01-24 21:42:56.879	\N
d46aec5f-f5e5-4e95-8171-870997c3b4dc	65	"[{\\"id\\":\\"d3ec4dec-9120-4c94-a413-2ad6d8088c66\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"a6c3891f-8f1d-44fa-839b-c5a38e546c12\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	completed	2026-01-24 21:11:06.319	2026-01-24 21:21:02.983	\N
e9ec52a7-d957-4687-8a02-b4c70b3b1fc6	65	"[{\\"id\\":\\"9b5b1917-97b0-4657-b3c1-2fa226794252\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":3},{\\"id\\":\\"786ce2ca-5f06-4194-b438-8271aae8f8d9\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":2}]"	completed	2026-01-24 21:21:03.022	2026-01-24 21:43:28.638	\N
5b238664-0928-46ea-9ec6-ca054c77edeb	65	"[{\\"id\\":\\"d84f3a78-3307-42b8-9e1b-96aba1536553\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	completed	2026-01-24 22:11:20.974	2026-01-24 22:12:51.898	\N
1d822edd-68b9-4b4b-98f2-9774f2604972	67	"[{\\"id\\":\\"0b3e4b5c-277b-4312-8183-504d7152f76d\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1}]"	completed	2026-01-24 21:42:57.363	2026-01-24 21:43:56.866	\N
b40c23a6-a821-420b-9ac8-2820bdeee942	67	"[{\\"id\\":\\"e78d4c95-ca18-4934-bfe0-a2e101be77fb\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1},{\\"id\\":\\"8e7f5900-6e3f-43cf-af7a-bddc248c7bf5\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1}]"	completed	2026-01-24 22:36:31.363	2026-01-24 22:39:23.624	\N
a7b8dee7-e292-47d7-af9f-37c5e251f520	65	"[{\\"id\\":\\"d0dce334-496a-4b24-9c87-364a6f88a69a\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	completed	2026-01-24 21:43:28.685	2026-01-24 21:48:31.961	\N
56cd70fa-ae2a-4607-bda6-f7cebe237cee	67	"[{\\"id\\":\\"3218a20a-947e-49dc-b681-65a4436c8f19\\",\\"variantId\\":115,\\"productId\\":87,\\"name\\":\\"Tonica - Standard\\",\\"price\\":3,\\"quantity\\":1}]"	completed	2026-01-24 23:19:59.412	2026-01-24 23:20:27.146	\N
1934d309-5467-4a21-890b-c6a49e8443da	67	"[{\\"id\\":\\"ec545fa7-b906-4050-a050-353a9e1fd305\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	completed	2026-01-24 22:39:24.144	2026-01-24 22:39:38.813	\N
764abcbf-70bd-4aaa-974f-74e145f4bb35	67	"[{\\"id\\":\\"deae7a01-cf77-466b-a290-aff91dd8763c\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1}]"	completed	2026-01-24 22:12:51.956	2026-01-24 22:27:41.811	\N
d889e652-a30d-4c63-a721-17d73f7bfb94	67	"[{\\"id\\":\\"d3bb9d25-0120-4f12-995c-884a02c2094c\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":2}]"	completed	2026-01-24 23:09:44.09	2026-01-24 23:19:11.593	\N
c16326fc-afe2-4e33-a0a4-ac1871e83bbd	67	"[{\\"id\\":\\"a2efe2b2-7895-4dee-aff6-de697fcaf839\\",\\"variantId\\":115,\\"productId\\":87,\\"name\\":\\"Tonica - Standard\\",\\"price\\":3,\\"quantity\\":1}]"	completed	2026-01-24 22:39:39.291	2026-01-24 22:40:09.675	\N
8a5dd54e-9a23-428e-a513-aec74e5de99a	67	"[{\\"id\\":\\"ac2f0665-5e84-4c1a-b66d-debfd53bc3ef\\",\\"variantId\\":119,\\"productId\\":89,\\"name\\":\\"Vodka Lemon - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	completed	2026-01-24 22:45:44.078	2026-01-24 22:48:00.563	\N
69aa546b-2dfc-424a-935a-e4243e64bf01	67	"[{\\"id\\":\\"e43d05ed-b20a-421c-b57c-0d4b147efc5a\\",\\"variantId\\":134,\\"productId\\":95,\\"name\\":\\"Vodka Shot - Standard\\",\\"price\\":3,\\"quantity\\":1}]"	completed	2026-01-24 22:40:09.98	2026-01-24 22:41:55.59	\N
3ff7c510-7bf6-4aa8-bc52-469b852a42df	67	"[{\\"id\\":\\"36db61ce-68d6-4dd1-8cd1-5f1e66a26e48\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1}]"	completed	2026-01-24 22:48:00.73	2026-01-24 23:02:19.735	\N
fdf90dfc-3a7b-474a-8491-3e9c4c31d58d	67	"[{\\"id\\":\\"6d7eeea7-7a77-4bc1-b000-3d5c216dd3aa\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1}]"	completed	2026-01-24 23:02:19.825	2026-01-24 23:09:43.533	\N
b14b1640-1169-46c0-bdc5-540e687150cc	67	"[{\\"id\\":\\"70154fbf-e588-47cc-bd5e-1e4591f36370\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	completed	2026-01-24 23:19:11.653	2026-01-24 23:19:58.928	\N
2a898136-fa11-4bbc-bf1e-1ace8258f160	67	"[{\\"id\\":\\"6a8ce232-4934-411d-89ac-eb0dae782a54\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1}]"	completed	2026-01-24 23:20:27.506	2026-01-24 23:22:42.1	\N
0aec040d-88b2-478a-be8c-7373985b2381	65	"[{\\"id\\":\\"bfe24095-90c6-426d-8fd5-fde9ba4dffa5\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":2},{\\"id\\":\\"bada680f-f01d-4236-9eb8-a68e61bb2aab\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":3}]"	completed	2026-01-24 22:12:51.992	2026-01-24 23:25:25.605	\N
c9e02356-420c-4c60-8909-12e446d52312	67	"[{\\"id\\":\\"d668ab0d-1801-49a8-88bd-348a4a61e456\\",\\"variantId\\":132,\\"productId\\":93,\\"name\\":\\"Gin Lemon - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	completed	2026-01-24 23:22:42.572	2026-01-24 23:27:13.394	\N
e2c8df27-68d9-4aed-931e-8756e8ebd679	67	"[{\\"id\\":\\"d3ac2465-80cb-49b2-8f82-f1d5116aeffb\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	completed	2026-01-24 23:27:13.518	2026-01-24 23:27:22.526	\N
72791a06-5bde-42c6-8118-7fcf3315c00e	66	"[{\\"id\\":\\"564b0090-b375-4fd5-8a03-2298dcdd1c9e\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":2}]"	completed	2026-01-31 23:10:06.795	2026-01-31 23:10:16.017	\N
2cb2bc06-3924-462d-aa94-b4b15be2a9c4	67	"[{\\"id\\":\\"7b917ed1-ab08-4cfb-b9cd-2fcc8488e702\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	completed	2026-01-31 23:08:52.991	2026-01-31 23:15:31.338	\N
a1fb02ec-a651-4c03-82e2-77d6a4fa91b3	66	"[{\\"id\\":\\"47e185ab-ea43-4c86-8ca4-60ee3c368ecc\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":2}]"	completed	2026-01-31 23:10:16.086	2026-01-31 23:15:35.954	\N
0fd0e73d-9db0-4eee-9013-5e2f767969a3	67	"[{\\"id\\":\\"7b81ad16-fb7d-4ab8-84d9-66011c3802fd\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1}]"	completed	2026-01-31 23:08:53.003	2026-01-31 23:17:17.153	\N
9f7efb1c-8a91-4537-ab94-081b4b3367bf	67	"[{\\"id\\":\\"49130a04-2d91-488d-b3b8-d6205c761f5f\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1}]"	completed	2026-02-01 00:06:15.572	2026-02-01 00:08:48.601	\N
fd0e749e-1196-4924-934a-10dec45ed8c4	67	"[{\\"id\\":\\"516743b3-1485-49c8-a6fd-911a338f4068\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1}]"	completed	2026-01-31 23:17:17.621	2026-01-31 23:17:31.83	\N
9e6b8fc4-3c6f-4262-ac0c-f198377e2249	66	"[{\\"id\\":\\"0d592c80-40af-4b26-9110-2345412429fd\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"57e3711f-9f02-4b04-8f9e-e61f4f48d2f2\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	completed	2026-01-31 23:20:09.784	2026-01-31 23:37:22.895	\N
335bd010-d7fe-435c-ad7b-c8ff301260dc	66	"[{\\"id\\":\\"21a11d02-3102-4fa2-b3e1-4a6897ce56ac\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"5af2eb90-f41c-44fb-bf22-45eec1b3159d\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	completed	2026-01-31 23:15:36.026	2026-01-31 23:20:09.735	\N
84bbc8a6-ffbf-41ea-b26c-ef8e37e41607	67	"[{\\"id\\":\\"912cabd7-9e0e-4151-b14b-9518f216e769\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	completed	2026-01-31 23:45:26.577	2026-01-31 23:52:55.158	\N
e828aa47-442f-41db-b1e9-cfa077fc35a6	67	"[{\\"id\\":\\"c2b27e47-5d9a-47fb-b3c8-2ee6842e79d9\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	completed	2026-01-31 23:17:31.927	2026-01-31 23:20:34.514	\N
c0593fd6-2453-481f-9bc6-4aeef4a69929	67	"[{\\"id\\":\\"16461ea9-917a-432f-a8e6-f14bf32e6011\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1},{\\"id\\":\\"70159ac4-c6b3-4dab-b0c7-c5811379ed50\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":1}]"	completed	2026-01-31 23:33:51.085	2026-01-31 23:42:33.987	\N
f2c2d073-c806-42fb-8f78-c4054e429ac3	67	"[{\\"id\\":\\"166940cc-a225-4724-ab8d-a789b05e64d3\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":2}]"	completed	2026-01-31 23:20:34.608	2026-01-31 23:25:28.719	\N
d10a115c-a1cf-4949-a340-e2515fc92a94	67	"[{\\"id\\":\\"5056b1d7-1b75-431b-80ee-c2daa33dc895\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1}]"	completed	2026-01-31 23:25:29.361	2026-01-31 23:25:39.965	\N
438fe2d4-5a91-407b-a14a-6dd7ac1ff116	67	"[{\\"id\\":\\"8c5f5e9f-27cf-4036-ad84-6d75dd2b502b\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1}]"	completed	2026-01-31 23:25:40.347	2026-01-31 23:25:55.109	\N
fb371f49-33e8-43f8-8599-edaffac15001	67	"[{\\"id\\":\\"3a4c6ee6-98d3-4ac4-b948-c4ae2df09f24\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1}]"	completed	2026-01-31 23:42:34.443	2026-01-31 23:45:26.401	\N
aea9ba2e-13b0-4015-bf59-01a458b0c5b4	67	"[{\\"id\\":\\"b7c47d11-2e71-40ef-9fc1-703c1c842848\\",\\"variantId\\":137,\\"productId\\":97,\\"name\\":\\"Sipsmith Tonica - Standard\\",\\"price\\":12,\\"quantity\\":1}]"	completed	2026-01-31 23:25:55.602	2026-01-31 23:32:59.357	\N
af2c37cd-f9ec-4167-ba5e-bcd8ac4b0998	67	"[{\\"id\\":\\"4c267836-761f-406a-9c3b-ad4ca4cb296b\\",\\"variantId\\":134,\\"productId\\":95,\\"name\\":\\"Vodka Shot - Standard\\",\\"price\\":3,\\"quantity\\":3}]"	completed	2026-01-31 23:32:59.481	2026-01-31 23:33:44.621	\N
50091bfd-0001-4937-a758-f661ca217810	67	"[{\\"id\\":\\"3b9151c5-a89b-4601-884f-2fa8b67701ff\\",\\"variantId\\":134,\\"productId\\":95,\\"name\\":\\"Vodka Shot - Standard\\",\\"price\\":3,\\"quantity\\":2}]"	completed	2026-01-31 23:33:44.931	2026-01-31 23:33:50.854	\N
0537c17b-50f2-4880-a16d-949b2905f655	67	"[{\\"id\\":\\"ae23e389-f213-4bdc-8ca2-aa52f22d60d9\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	completed	2026-01-31 23:45:26.586	2026-01-31 23:55:38.529	\N
5ce772a7-ebf3-4521-b987-64f69c4584a7	67	"[{\\"id\\":\\"8ccd5206-69d0-4e9b-b8f8-5712daca7ed9\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	completed	2026-02-01 00:08:49.434	2026-02-01 00:10:51.362	\N
1cfa05a0-3f74-4113-9add-443f10c64f41	67	"[{\\"id\\":\\"ac0f0074-f35a-4df0-9726-b866153b82b6\\",\\"variantId\\":119,\\"productId\\":89,\\"name\\":\\"Vodka Lemon - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	completed	2026-01-31 23:55:38.722	2026-02-01 00:04:18.125	\N
ce440d3f-0c78-47bd-b0c7-d394db63323f	66	"[{\\"id\\":\\"796361f6-c916-448d-a7fb-0a7f55323c97\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":2},{\\"id\\":\\"69f339cc-132f-4931-8e31-54afdf942910\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":2}]"	completed	2026-01-31 23:37:22.952	2026-01-31 23:50:14.137	\N
c46e8908-4154-4aba-8db1-a39035f9790d	67	"[{\\"id\\":\\"34fa98e5-9b49-4aaa-88dd-553fe5aa8145\\",\\"variantId\\":116,\\"productId\\":88,\\"name\\":\\"Lemonsoda - Standard\\",\\"price\\":3,\\"quantity\\":1}]"	completed	2026-02-01 00:04:18.189	2026-02-01 00:04:44.215	\N
23788c6e-b708-495e-803f-6da9a5d6a2eb	67	"[{\\"id\\":\\"aa3cc004-7afe-4313-85b4-93626ea72ce6\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1}]"	completed	2026-02-01 00:04:44.264	2026-02-01 00:06:15.369	\N
7a74d3e7-77b8-42a8-be8c-8ef7c2093a92	67	"[{\\"id\\":\\"2dfc35c6-6091-4032-9596-e44902461e75\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1}]"	completed	2026-02-01 00:14:16.426	2026-02-01 00:18:23.126	\N
c3cd7065-dfc2-4831-a653-7e4906a53dee	67	"[{\\"id\\":\\"22820d3f-f308-4520-be84-f9b22252e248\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":2},{\\"id\\":\\"670e1ecd-7ab1-4f0f-8e19-5db7f99a8aaf\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1}]"	completed	2026-02-01 00:10:51.483	2026-02-01 00:14:16.129	\N
c8ad7291-f9ba-4d44-92e3-e1b9a5bfc515	67	"[{\\"id\\":\\"35da3df7-3bc3-4161-9793-c5ad369369ea\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":3}]"	completed	2026-02-01 00:31:33.931	2026-02-01 00:32:45.74	\N
2b982801-f1d9-46ac-bbf2-9e63976ab753	67	"[{\\"id\\":\\"3eedff8d-e250-41d2-adb2-e4b0be71faf7\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1}]"	completed	2026-02-01 00:18:23.875	2026-02-01 00:31:33.833	\N
8141ab1f-d2b6-4c94-a866-60fb13b83f61	67	"[{\\"id\\":\\"0d52871a-5329-4acf-a54c-d9a2c6f1a25c\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1}]"	completed	2026-02-01 00:32:45.932	2026-02-01 00:38:40.077	\N
f8030819-6b28-4441-8bdc-8f3ecc32292e	67	"[{\\"id\\":\\"949221d6-2589-4317-82c0-29d00c9fc21a\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1}]"	completed	2026-02-01 00:38:40.56	2026-02-01 00:41:42.762	\N
4bed7cc5-fa51-4e23-bf2e-6b7a7fd43eae	67	"[{\\"id\\":\\"7e1ffdad-32d1-46b4-a0d7-5c41b3bc0e88\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1},{\\"id\\":\\"a50ada1b-1f97-4f50-af73-c0879a416dbb\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1}]"	completed	2026-02-01 00:41:43.042	2026-02-01 00:59:58.688	\N
bbfac6de-a6f8-42a3-9cff-7e22c245625c	66	"[]"	completed	2026-01-31 23:50:14.195	2026-02-01 01:54:40.613	\N
6143a550-6060-4b05-9e23-3d3f75daccfe	67	"[{\\"id\\":\\"95203692-d843-460e-9a6b-63a728984830\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1}]"	completed	2026-02-01 00:59:58.88	2026-02-01 01:05:30.841	\N
f549501c-f6eb-4657-ac16-83cf89226fed	66	"[{\\"id\\":\\"a7316a42-b1ad-42ff-b3d0-e6793d7132e9\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 17:26:11.745	2026-02-15 17:37:13.651	\N
d558e8e0-9d14-465c-bff2-9aad270624c1	67	"[{\\"id\\":\\"792b140e-e2fe-4c09-9a15-5f7c4b744566\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1}]"	completed	2026-02-01 01:05:30.936	2026-02-01 01:12:40.944	\N
78d42f42-6f86-4a46-afb2-40cbf7b0b172	66	"[{\\"id\\":\\"43a9f205-863d-47b3-a056-a572d0fbf47c\\",\\"variantId\\":127,\\"productId\\":86,\\"name\\":\\"Pirlo Campari - Standard\\",\\"price\\":5,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2025-12-31 18:45:11.027	2026-02-11 09:57:11.676	\N
d6e0a48b-1705-4fff-b51a-fd989a434524	67	"[{\\"id\\":\\"1a2afc7f-7ba9-40a6-866e-d04d1b96b049\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1}]"	completed	2026-02-01 01:12:41.561	2026-02-01 01:18:51.16	\N
a5936d80-1113-4e51-b54a-efa3242cae23	67	"[{\\"id\\":\\"fba51763-b656-43e2-be9e-87825bdaf23a\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":1}]"	completed	2026-02-01 01:18:51.455	2026-02-01 01:42:40.237	\N
6c40ad0f-8ba1-4479-8013-ec0067332bbb	66	"[{\\"id\\":\\"9633c5ef-6e57-496c-b638-dee882509514\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":4,\\"effectiveTaxRate\\":0},{\\"id\\":\\"fb5fe2bc-23b7-474e-b22c-f9183650c2b8\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":4,\\"effectiveTaxRate\\":0},{\\"id\\":\\"1aa4dc55-d14d-4fdd-aa52-6b4e0f9022f2\\",\\"variantId\\":134,\\"productId\\":95,\\"name\\":\\"Vodka Shot - Standard\\",\\"price\\":3,\\"quantity\\":8,\\"effectiveTaxRate\\":0},{\\"id\\":\\"7b917ed1-ab08-4cfb-b9cd-2fcc8488e702\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":2,\\"effectiveTaxRate\\":0},{\\"id\\":\\"49130a04-2d91-488d-b3b8-d6205c761f5f\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":2,\\"effectiveTaxRate\\":0}]"	completed	2025-12-31 22:05:10.904	2026-02-14 20:28:18.809	\N
205d00e9-16c5-4a40-acfd-a3455ed4da68	67	"[{\\"id\\":\\"745a6673-4383-488d-9d1e-4a4f0cff71c8\\",\\"variantId\\":134,\\"productId\\":95,\\"name\\":\\"Vodka Shot - Standard\\",\\"price\\":3,\\"quantity\\":4}]"	completed	2026-02-01 01:42:40.808	2026-02-01 01:48:24.425	\N
02a5d5ff-0c13-4e62-a2b8-a9450c425fab	66	"[{\\"id\\":\\"67f43ff5-9fd3-491f-8933-8f41748af9e3\\",\\"variantId\\":160,\\"productId\\":110,\\"name\\":\\"Wuhrer FF - Standard\\",\\"price\\":4,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2025-12-31 17:51:51.052	2026-02-15 01:48:56.544	\N
ba0dbfb3-98e7-47df-a7b1-c79c8d654705	66	"[{\\"id\\":\\"3942686b-d482-4408-93b6-1d21e0db7a8c\\",\\"variantId\\":134,\\"productId\\":95,\\"name\\":\\"Vodka Shot - Standard\\",\\"price\\":3,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2025-12-31 21:42:54.039	2026-02-15 02:32:05.695	\N
4230ac04-fd92-4143-bfd3-ab6e2f6a8fec	66	"[{\\"id\\":\\"92923f63-05fd-49b5-b271-c8627933acc5\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":3}]"	completed	2026-02-01 01:54:40.687	2026-02-01 02:17:21.729	\N
70928196-8936-4301-94f8-c99821350f31	65	"[{\\"id\\":\\"e0e56f49-2991-4cf9-9ab0-2db973029c39\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"06beba17-95aa-4641-86af-8924b705be6e\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-01-24 23:25:25.894	2026-02-15 17:12:54.691	\N
53d81421-e29a-4101-85b3-1fc3bc878566	66	"[{\\"id\\":\\"e28acadb-f259-4a4b-9335-e9d48b9d1f2d\\",\\"variantId\\":149,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":6,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2025-12-31 18:10:35.006	2026-02-15 17:18:13.511	\N
5cec3fb0-8a6e-4451-b04c-53724c4e8b9f	66	"[{\\"id\\":\\"85440655-f492-4a59-ae2f-898aa2349b28\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"13669d5f-0f20-4299-8cb7-f28dff22fa8b\\",\\"variantId\\":133,\\"productId\\":94,\\"name\\":\\"Gratis - Standard\\",\\"price\\":0.1,\\"quantity\\":2}]"	completed	2026-02-01 02:17:21.792	2026-02-01 02:21:34.092	\N
4e172f6a-bea7-4d62-82b5-60fc1627bf6c	66	"[{\\"id\\":\\"5dcabfe2-46c1-47b7-bafa-1d0ffbac545d\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"cbd725ba-d8b4-40ba-9653-78c623cb9329\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2025-12-31 22:05:10.931	2026-02-15 17:25:42.124	\N
3bf77b9f-8d45-49be-8501-930e66ae1811	66	"[{\\"id\\":\\"65b4ee1f-9635-4b76-ae9a-b40e7784c163\\",\\"variantId\\":148,\\"productId\\":102,\\"name\\":\\"Birra Beck's - Standard\\",\\"price\\":4,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2025-12-31 23:20:09.696	2026-02-15 17:26:11.614	\N
46133786-288d-4ad7-86d2-8fb89ccc8791	66	"[{\\"id\\":\\"43b565f5-fa60-4ea8-83ab-6b4c52d2911a\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"6d84bf8d-4c63-4222-a221-b88433f9226e\\",\\"variantId\\":148,\\"productId\\":102,\\"name\\":\\"Birra Beck's - Standard\\",\\"price\\":4,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 17:42:18.185	2026-02-15 17:47:07.737	\N
7f42c5d6-98e7-4fe3-a116-c8cd7e2eaafd	66	"[{\\"id\\":\\"a6f984fa-96e2-424f-a32d-db4961d93af5\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-01 02:21:34.17	2026-02-10 20:33:59.339	\N
11a0d427-6a87-4afc-bb1f-e3ce785da749	65	"[{\\"id\\":\\"2f48c958-344f-414e-ad46-e47bc490216f\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2025-12-31 18:33:05.955	2026-02-15 17:40:37.114	\N
de2dd673-8288-453e-af7e-b3f2acff33bd	66	"[{\\"id\\":\\"9fb3f414-afad-4fb2-82d9-8c9965996816\\",\\"variantId\\":127,\\"productId\\":86,\\"name\\":\\"Pirlo Campari - Standard\\",\\"price\\":5,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 17:37:13.746	2026-02-15 17:42:18.076	\N
aedc802e-e66d-4954-b12f-82cf9d7adfa5	65	"[{\\"id\\":\\"19e0fd70-d218-4db8-bb97-4e8839aa9fc5\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"e915e00a-e427-4ce6-ba95-944d0ac2073a\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2025-12-31 20:50:56.562	2026-02-15 17:55:09.127	\N
c984b232-492f-4a34-9e6b-8db637ad5a78	66	"[{\\"id\\":\\"94446e2d-9bd7-4d6f-aebb-cf9c92a53faa\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 17:47:07.834	2026-02-15 17:51:39.027	\N
5f17a11f-5948-4067-86c7-db29c82465f1	65	"[{\\"id\\":\\"824435b3-96f8-483d-a69e-da96e5a5f225\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"98b7afd8-4a4e-4941-82d8-5d64cc5c10fa\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2025-12-31 20:50:56.575	2026-02-15 17:58:45.484	\N
944c1cfd-b3fe-41b6-a75b-883718693b6e	66	"[{\\"id\\":\\"35688830-abc9-421c-a9ac-5bfada7d2936\\",\\"variantId\\":148,\\"productId\\":102,\\"name\\":\\"Birra Beck's - Standard\\",\\"price\\":4,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 17:51:39.105	2026-02-15 17:58:51.271	\N
1e997de3-0259-40cd-adb7-1e0ac99b3c5f	66	"[{\\"id\\":\\"932a8641-9ef8-41ca-a7c9-fbe6367c53a8\\",\\"variantId\\":169,\\"productId\\":96,\\"name\\":\\"Hierbas Shot - Standard\\",\\"price\\":3,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 17:58:51.36	2026-02-15 18:01:15.372	\N
0d0b8f89-fdc7-463f-9779-e429be537c13	67	"[{\\"id\\":\\"ecdd186a-e732-4a68-863e-26c3c8c83c25\\",\\"variantId\\":127,\\"productId\\":86,\\"name\\":\\"Pirlo Campari - Standard\\",\\"price\\":5,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	completed	2026-01-31 23:08:01.028	2026-02-15 21:23:07.319	\N
a81150e3-811f-4661-978b-02e2cd33092a	65	"[{\\"id\\":\\"5ba684e3-748e-413c-891c-e178792233db\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"3973117b-0c06-4e9e-878e-59994e4fc678\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 19:20:48.096	2026-02-15 19:25:17.318	\N
45a3b1bc-1ded-4d41-85e7-cf66802f4d74	65	"[{\\"id\\":\\"dd32bd76-549a-47fa-a998-7b56afca325b\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2025-12-31 21:44:54.384	2026-02-15 17:59:41.894	\N
dfc9b461-306e-4066-87a6-8d33362b4a01	65	"[{\\"id\\":\\"6a05c4c8-08b8-4c9f-8a70-cbce1277de5f\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-01-01 02:12:43.857	2026-02-15 18:00:11.545	\N
ea1911e1-c363-472b-be26-51e0b70b5f3c	65	"[{\\"id\\":\\"23f71b7d-6135-4891-8e0f-0a7bb0ab45cc\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"904a60d5-ad17-412c-9f29-fbda06cf389d\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 18:17:28.277	2026-02-15 18:30:15.217	\N
8befe58d-4dc8-4c41-8631-6d5222e81e23	66	"[{\\"id\\":\\"4d84e0d2-e1ad-4880-9747-1be09e735442\\",\\"variantId\\":149,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":6,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 18:01:15.486	2026-02-15 18:01:21.213	\N
e694c172-953f-47f2-bbae-553d040bc0a9	66	"[{\\"id\\":\\"6bd1e51c-c26e-45ff-b53b-351b21cf3643\\",\\"variantId\\":119,\\"productId\\":89,\\"name\\":\\"Vodka Lemon - Standard\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 18:01:21.287	2026-02-15 18:06:55.326	\N
b9eae286-59eb-4a5f-973f-3e4d28e09182	66	"[{\\"id\\":\\"943ca103-0e82-482c-a08e-0cfcf907e087\\",\\"variantId\\":149,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":6,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 19:01:34.14	2026-02-15 19:11:10.033	\N
a5e823a7-39bc-4ceb-af80-8a5c386510d9	66	"[{\\"id\\":\\"dfdfa12e-dd32-4a3d-b086-d58ee77c79b4\\",\\"variantId\\":151,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 18:06:55.422	2026-02-15 18:07:05.475	\N
8e5fd9f3-3f46-452a-acb8-04108b4bc231	66	"[{\\"id\\":\\"59c69675-a9e8-4d51-83b9-c7c7fa724a7a\\",\\"variantId\\":127,\\"productId\\":86,\\"name\\":\\"Pirlo Campari - Standard\\",\\"price\\":5,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 18:17:46.37	2026-02-15 18:31:56.381	\N
12c69787-045f-4477-913b-54b3fa9321aa	66	"[{\\"id\\":\\"a1cd4ea0-0645-4e7f-b666-28df5f34ff36\\",\\"variantId\\":127,\\"productId\\":86,\\"name\\":\\"Pirlo Campari - Standard\\",\\"price\\":5,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 18:07:05.555	2026-02-15 18:07:29.843	\N
d1bbedd5-a565-4301-9bea-b79b6502c0da	66	"[{\\"id\\":\\"cbdd99df-7645-4e5b-adb1-f0a11630e7e9\\",\\"variantId\\":119,\\"productId\\":89,\\"name\\":\\"Vodka Lemon - Standard\\",\\"price\\":8,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 18:07:30.007	2026-02-15 18:10:08.02	\N
e2540e6f-af21-40e1-b164-b3669c757faa	66	"[{\\"id\\":\\"cb07c916-be69-44db-bcf3-484b17bb4b1b\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 18:10:08.099	2026-02-15 18:10:13.35	\N
cefd2e83-2c62-42a8-a962-e6ed13ef821a	65	"[{\\"id\\":\\"9e3bf4d6-4501-4f05-bc63-959c58431de6\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 18:30:15.285	2026-02-15 18:32:19.791	\N
87bf2be9-90bc-4bb9-880b-2a197886726e	65	"[{\\"id\\":\\"17c919ce-1db1-4151-9a54-5bbfcae43d11\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"88b4a86c-b6a6-4e61-bc59-f1ac877e4ac4\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-01-23 17:25:31.034	2026-02-15 18:17:28.198	\N
187775e3-98b4-41c7-81ab-212a9ad55050	66	"[]"	completed	2026-02-15 18:10:13.439	2026-02-15 18:17:35.774	\N
7b9cd30b-710b-4109-8dcc-22d3a58a769e	66	"[{\\"id\\":\\"9941d5bc-4282-4ee3-bdcf-d6fe47294c55\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 18:17:35.864	2026-02-15 18:17:46.283	\N
3467e792-8ae8-4087-8dd8-04677cbb3065	65	"[{\\"id\\":\\"989ff965-1df6-4b76-9a34-fc32617fc7a1\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 18:32:19.85	2026-02-15 19:15:57.451	\N
2dff846a-f31e-4c71-82bf-4a77d0dd7fc0	66	"[{\\"id\\":\\"d4e64b76-610b-4411-96ce-8557a297e386\\",\\"variantId\\":150,\\"productId\\":93,\\"name\\":\\"Gin Lemon - Standard\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 18:31:56.477	2026-02-15 18:36:33.903	\N
f94e4fce-445f-467b-9661-579e53087701	66	"[{\\"id\\":\\"65a032c3-42f9-4610-917b-1746b469cbb0\\",\\"variantId\\":127,\\"productId\\":86,\\"name\\":\\"Pirlo Campari - Standard\\",\\"price\\":5,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 18:36:34.105	2026-02-15 18:42:58.366	\N
b2997312-5d43-4394-824b-b4c2b57b0205	66	"[{\\"id\\":\\"2aac2ab7-2c1b-4a02-a719-67af8c26417b\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 19:26:29.293	2026-02-15 19:26:37.103	\N
feb5e6cc-7e15-48f7-ba94-04c5d106253b	66	"[{\\"id\\":\\"3a90dfb8-18ff-425c-b800-46dbca0f5ba2\\",\\"variantId\\":148,\\"productId\\":102,\\"name\\":\\"Birra Beck's - Standard\\",\\"price\\":4,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 18:42:58.515	2026-02-15 18:52:54.847	\N
a7ab5ab9-7e56-4312-8162-e1500a9bf4a4	66	"[{\\"id\\":\\"a3d1437e-d8fc-4465-b12b-79e0e8c291eb\\",\\"variantId\\":151,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 19:11:10.111	2026-02-15 19:17:05.504	\N
6c59f52c-be8b-4d2f-8d96-29a11100c8b3	66	"[{\\"id\\":\\"591362a8-4594-4a87-a13c-f2c83545d478\\",\\"variantId\\":127,\\"productId\\":86,\\"name\\":\\"Pirlo Campari - Standard\\",\\"price\\":5,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 18:52:54.98	2026-02-15 19:01:33.966	\N
546496db-2cec-402c-9679-59054fdb03e1	66	"[{\\"id\\":\\"bc0105a3-7601-4792-8f80-8e315c622416\\",\\"variantId\\":168,\\"productId\\":95,\\"name\\":\\"Vodka Shot - Standard\\",\\"price\\":3,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 19:17:05.592	2026-02-15 19:26:29.176	\N
cdb40cc1-ba04-4642-a7c4-e3221a1ec556	65	"[{\\"id\\":\\"03cd22e7-aec1-439d-9f93-f0a7919dc007\\",\\"variantId\\":164,\\"productId\\":94,\\"name\\":\\"Gratis - Standard\\",\\"price\\":0,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 19:15:57.501	2026-02-15 19:20:48.025	\N
ebf09957-c358-4775-b78b-d3980dc14410	66	"[{\\"id\\":\\"361fac07-617e-4d55-a26a-f02e11e1b2e4\\",\\"variantId\\":127,\\"productId\\":86,\\"name\\":\\"Pirlo Campari - Standard\\",\\"price\\":5,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 19:26:37.213	2026-02-15 19:30:06.304	\N
57b4dc89-c253-481a-ae5e-a3383d51dd25	66	"[{\\"id\\":\\"98ae0d77-b303-4bac-806d-30066231121c\\",\\"variantId\\":127,\\"productId\\":86,\\"name\\":\\"Pirlo Campari - Standard\\",\\"price\\":5,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 19:30:06.385	2026-02-15 19:41:21.378	\N
620c73c2-a2f4-4188-8f86-241e3f3e7e74	65	"[{\\"id\\":\\"01971c01-afa6-49a0-b463-f8a6bc56fd28\\",\\"variantId\\":164,\\"productId\\":94,\\"name\\":\\"Gratis - Standard\\",\\"price\\":0,\\"quantity\\":4,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 19:25:17.366	2026-02-15 19:44:21.652	\N
6fe7deab-65b6-45f2-94c2-3c783b2e11e6	65	"[{\\"id\\":\\"a66bd7b1-da32-4fad-a25e-afaa63c74ce4\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 19:44:21.712	2026-02-15 19:50:03.061	\N
04c45ea1-d972-45f6-b57d-6c58ad04b77b	66	"[{\\"id\\":\\"47669df2-9603-4e73-981f-20ba54486e39\\",\\"variantId\\":149,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":6,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 19:41:21.497	2026-02-15 19:52:48.319	\N
1a2adee1-ac78-4198-8b46-453a374f3e7f	66	"[{\\"id\\":\\"4d59e4b2-9c94-493d-be0e-2f42303d4fe6\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 19:52:48.401	2026-02-15 19:55:05.112	\N
75579f8a-ce3b-4a91-bd63-b32f9090f271	66	"[{\\"id\\":\\"5d014f88-eb76-4f44-8e20-29a16b6d7437\\",\\"variantId\\":148,\\"productId\\":102,\\"name\\":\\"Birra Beck's - Standard\\",\\"price\\":4,\\"quantity\\":3,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"7722cf2c-d70a-4760-b95a-813199098ee7\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 20:08:45.377	2026-02-15 20:19:33.103	\N
4726eae5-8a5a-4cad-a1bb-96783f41521e	66	"[{\\"id\\":\\"4c7fe372-a6b9-4856-b304-0993270cae20\\",\\"variantId\\":149,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":6,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 19:55:05.19	2026-02-15 19:55:14.196	\N
3e664dc6-1581-468f-82e9-956a101f2faa	66	"[{\\"id\\":\\"ab9e1232-a0fc-4dc2-8c08-f2ccf81cc589\\",\\"variantId\\":150,\\"productId\\":93,\\"name\\":\\"Gin Lemon - Standard\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"4aa08263-9d77-4dda-b2b4-8775ea88453c\\",\\"variantId\\":151,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"0b4162c7-3501-4fa7-8218-453ef6569792\\",\\"variantId\\":137,\\"productId\\":97,\\"name\\":\\"Sipsmith Tonica - Standard\\",\\"price\\":12,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 20:04:07.235	2026-02-15 20:07:25.531	\N
767479b2-974b-4c41-9cea-2f956924c6f8	66	"[{\\"id\\":\\"8780d58c-b8e4-43d6-ae0d-4e0538b8372a\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 19:55:14.302	2026-02-15 19:55:22.694	\N
fa7d4092-20fa-4663-9537-d96510d55583	66	"[{\\"id\\":\\"31498c47-3029-4cf6-938f-3b2d008d925e\\",\\"variantId\\":127,\\"productId\\":86,\\"name\\":\\"Pirlo Campari - Standard\\",\\"price\\":5,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 19:55:22.757	2026-02-15 19:55:32.438	\N
55dab8db-cf90-4e37-b68f-926097c62611	65	"[{\\"id\\":\\"4e9ac9cd-cbe3-4db4-b287-6fd71e9adb3b\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"355c7efb-a134-4abf-b73c-54aeb9cbf853\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 19:50:03.12	2026-02-15 20:01:30.456	\N
50dbee50-7c34-49c8-a9f4-5274a540c757	66	"[{\\"id\\":\\"8d628143-2b07-4965-80f8-e9b276433892\\",\\"variantId\\":149,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":6,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 20:07:25.614	2026-02-15 20:07:34.622	\N
01016e87-8496-4a01-b2b7-90f6571b418d	65	"[{\\"id\\":\\"bfacb8b2-430e-4acd-a64b-9cf441842dc0\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"83c29867-6429-48d9-bf70-de6db6bf40ff\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 20:01:30.532	2026-02-15 20:04:01.904	\N
7c2de358-a91c-40e2-be55-8f229013f00f	66	"[{\\"id\\":\\"6b66dce3-1d21-4ce7-9b2e-632e94f1b94d\\",\\"variantId\\":151,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 19:55:32.519	2026-02-15 20:04:07.129	\N
e7af94e6-38e8-4c99-b07d-8c759dc91b64	66	"[{\\"id\\":\\"e1551999-e3bc-4177-b8e0-6c5eb476869b\\",\\"variantId\\":167,\\"productId\\":101,\\"name\\":\\"Ginger Beer - Standard\\",\\"price\\":3,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 20:07:34.702	2026-02-15 20:07:43.036	\N
0ef2a025-fc0c-4a77-a42b-ec60f34ea776	65	"[{\\"id\\":\\"32d7ae59-ff87-403a-981a-0ba6510e5206\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 20:04:01.971	2026-02-15 20:05:01.88	\N
ae164c46-4e71-4598-b631-3397fed65a2e	65	"[{\\"id\\":\\"91898f9c-87c0-4ed7-bea3-b0df2816efe3\\",\\"variantId\\":164,\\"productId\\":94,\\"name\\":\\"Gratis - Standard\\",\\"price\\":0,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 20:07:48.985	2026-02-15 20:26:13.359	\N
b870178b-ca4a-4d2e-8a1b-d804cf8cf273	65	"[{\\"id\\":\\"16f1a311-f059-48b6-99c6-0de21d6d0f60\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 20:05:01.935	2026-02-15 20:05:45.163	\N
3d3406cb-4358-4050-8f28-6e79dd0c4b2c	66	"[{\\"id\\":\\"6ce95669-0497-477e-aeab-c9b0395624df\\",\\"variantId\\":151,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 20:07:43.1	2026-02-15 20:07:59.647	\N
7f71a9d1-5937-42f7-b013-e00f58e776a8	66	"[{\\"id\\":\\"7f50fd23-50cc-42bc-af2b-ce763386196b\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 20:07:59.729	2026-02-15 20:08:10.181	\N
cb864a97-60c4-4f73-933a-205499826429	65	"[{\\"id\\":\\"60187228-f1cc-471d-8bc2-9c497df87279\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"3081f913-fbed-4164-bd17-404d5298e257\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 20:05:45.215	2026-02-15 20:07:48.934	\N
54ad9884-6e44-4baa-8c13-7ad6ca675ae4	66	"[{\\"id\\":\\"d3275950-56e4-4c24-b7bb-6c8685cd536b\\",\\"variantId\\":149,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":6,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 20:08:10.251	2026-02-15 20:08:45.288	\N
7462e9c5-36c7-4547-89fd-6fd3613749fa	65	"[{\\"id\\":\\"bea1afff-f3a7-4614-8e04-4670d488e216\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 20:26:13.423	2026-02-15 20:28:25.339	\N
0501cba8-5d18-4a6c-8ad0-fa8a732ac354	66	"[]"	completed	2026-02-15 20:50:01.762	2026-02-15 20:51:14.681	\N
46618344-6b0e-44a4-b0d5-f6087d280a33	66	"[{\\"id\\":\\"6dfad584-8242-4533-9d60-b56f5a132454\\",\\"variantId\\":151,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 20:28:32.407	2026-02-15 20:32:48.687	\N
16242086-13fe-4669-8308-c39c7fa7ccb0	66	"[{\\"id\\":\\"af217518-e0ab-4655-ab58-ee833c9c00fc\\",\\"variantId\\":127,\\"productId\\":86,\\"name\\":\\"Pirlo Campari - Standard\\",\\"price\\":5,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 20:19:33.215	2026-02-15 20:28:32.283	\N
c95c1ccb-29fb-4086-961f-396838c64792	65	"[]"	pending_logout	2026-02-15 20:28:25.403	2026-02-15 20:35:07.063	2026-02-15 20:35:07.063
8c92a3bb-92d8-45e5-9f27-e0a01413ae57	66	"[{\\"id\\":\\"88d4787e-07c3-4b95-8f6f-605142721f24\\",\\"variantId\\":151,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 20:32:48.778	2026-02-15 20:38:48.105	\N
d430c2b3-8195-44ab-a0e2-35aec56d4fc0	66	"[{\\"id\\":\\"aa9c1f4a-4fa0-47fd-b847-1820796c4048\\",\\"variantId\\":149,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":6,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 20:38:48.214	2026-02-15 20:50:01.66	\N
cad8caea-bb3e-4a1b-a34e-ac40106dcc6d	66	"[{\\"id\\":\\"73ee9dd1-8ae6-4dfa-baef-c2dcc2890bcc\\",\\"variantId\\":151,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 20:51:14.747	2026-02-15 20:53:06.702	\N
90e6ce3a-ee97-4476-bdf1-0db49de0c22e	66	"[{\\"id\\":\\"1cb6e576-a943-40de-b863-f4c64d56346b\\",\\"variantId\\":169,\\"productId\\":96,\\"name\\":\\"Hierbas Shot - Standard\\",\\"price\\":3,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 20:53:06.763	2026-02-15 20:55:59.189	\N
4a084186-3b4a-412b-b614-5288fa196763	66	"[{\\"id\\":\\"108ffdfc-0f51-4354-8439-b4948b4bf515\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"8fa4b20d-321a-4012-8a88-c64b436d43d3\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 20:55:59.29	2026-02-15 20:57:26.273	\N
0f84feca-f943-471c-9775-9e5e097c7f47	66	"[{\\"id\\":\\"713109eb-abce-449d-8042-6e128397bc25\\",\\"variantId\\":151,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"f8dfd470-ddfc-4e92-819e-968f4795d16f\\",\\"variantId\\":137,\\"productId\\":97,\\"name\\":\\"Sipsmith Tonica - Standard\\",\\"price\\":12,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 20:57:26.492	2026-02-15 21:02:13.08	\N
80380dc1-0f4f-419a-9af9-9cfd03094fec	66	"[{\\"id\\":\\"55ef0f88-b2af-47b4-a977-28f28c928030\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 21:21:21.471	2026-02-15 21:22:30.611	\N
b6341df4-5242-4ee2-9f58-050ea55dacbd	66	"[{\\"id\\":\\"16df382c-fb04-4194-8fa1-d0a3fab38063\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"c040b0a7-3445-4cf5-afc2-c518ace156b1\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 21:26:15.148	2026-02-15 21:27:55.997	\N
8ae4668a-6230-4f8c-a94a-3ba605900f84	66	"[{\\"id\\":\\"3d23a39a-2223-4a6e-8291-25017bfd81e7\\",\\"variantId\\":149,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":6,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"52b72d75-6abb-453c-820e-26408fa2105a\\",\\"variantId\\":148,\\"productId\\":102,\\"name\\":\\"Birra Beck's - Standard\\",\\"price\\":4,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 21:02:13.173	2026-02-15 21:02:40.544	\N
32c4d0d0-d77a-4d1e-9526-36a2404c5318	66	"[{\\"id\\":\\"e9a58520-e02a-4c3d-9257-103578da2ef2\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 21:22:30.667	2026-02-15 21:23:01.775	\N
37e36506-5c3f-4ea2-bd08-9e3d023553c5	66	"[{\\"id\\":\\"764880b4-fd35-4898-b251-02be1af9d30e\\",\\"variantId\\":164,\\"productId\\":94,\\"name\\":\\"Gratis - Standard\\",\\"price\\":0,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 21:02:40.636	2026-02-15 21:06:50.188	\N
041e3a17-2105-4940-8d0e-71a678bab807	66	"[{\\"id\\":\\"5bcf8aaa-0a2a-411b-a7f6-ca2e93a5ddd5\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"28860d59-98b5-4c2a-bc0e-cdcc0154a4cd\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 21:06:50.247	2026-02-15 21:15:04.015	\N
0fffe337-8f10-4d19-afe6-e26b7901b8b6	66	"[{\\"id\\":\\"eb5fa9e3-53d7-4454-a7df-6c7e430aa843\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"49c13919-e77d-4d4a-a4cf-fd82fa664d95\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 21:15:04.078	2026-02-15 21:15:55.462	\N
a00f86c5-3b28-48d9-a979-0fa6852b175a	67	"[{\\"id\\":\\"2f4859b1-e188-467f-b6a5-f420ae7a6d7d\\",\\"variantId\\":150,\\"productId\\":93,\\"name\\":\\"Gin Lemon - Standard\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"f918a67e-68b9-43ea-a202-b2ef53d70f2a\\",\\"variantId\\":151,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-01 01:48:24.577	2026-02-15 21:23:48.923	\N
7c4301bb-189d-4754-86a9-1287c22188ad	66	"[{\\"id\\":\\"caa22608-b65b-4b55-9347-6e63cc8f6a7d\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"7ced67c8-936a-46c4-bd9e-89fb3cf50642\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 21:15:55.627	2026-02-15 21:20:37.494	\N
a21f2bbc-172a-4087-979b-e45f42fe421a	66	"[{\\"id\\":\\"1af6a8f4-3385-420a-8f37-8215e4a369da\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 21:20:37.551	2026-02-15 21:21:21.406	\N
a9afa2a0-c8dd-4e66-ac86-9d23533a9cee	67	"[{\\"id\\":\\"8b460782-ffcf-45d6-b394-d712432ce480\\",\\"variantId\\":151,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 21:23:49.002	2026-02-15 21:24:43.967	\N
68cadc9c-df14-4a00-925a-60e77ed28b3b	66	"[{\\"id\\":\\"e53c2f97-9d25-4230-ad3f-082a0e071578\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"7e94bb5f-aeae-4087-ae95-7b9d6265f938\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 21:27:56.065	2026-02-15 21:29:58.311	\N
a63be62a-fb10-48c2-8cb1-5667b2d8097d	67	"[{\\"id\\":\\"4a5da43c-889d-411a-b349-d2314206e7d7\\",\\"variantId\\":151,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 21:24:44.058	2026-02-15 21:25:07.027	\N
d5eb057f-54f5-4f80-800b-aa1216fbcc72	66	"[{\\"id\\":\\"4e7b919b-1b17-4428-98dc-cc223a0304d0\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 21:23:01.869	2026-02-15 21:26:14.599	\N
4d2653c2-8086-49dc-aaa9-aad398e6e40c	67	"[{\\"id\\":\\"2773cc24-85f9-4281-85f5-6a7da07b8d0f\\",\\"variantId\\":119,\\"productId\\":89,\\"name\\":\\"Vodka Lemon - Standard\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 21:25:07.107	2026-02-15 21:31:34.342	\N
94e48cd1-254d-4a27-aae1-2c569a0d8fdd	67	"[{\\"id\\":\\"4d2222a6-1d43-4cca-b77d-58c51d650338\\",\\"variantId\\":169,\\"productId\\":96,\\"name\\":\\"Hierbas Shot - Standard\\",\\"price\\":3,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 21:31:50.177	2026-02-15 21:32:03.221	\N
dc907139-b7c1-4c71-83af-100578f487e9	66	"[{\\"id\\":\\"890b1160-7257-4c5a-b7f9-6767e3f7caf1\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 21:29:58.369	2026-02-15 21:41:09.58	\N
87087787-982d-4924-8c73-99e9fe4dfb52	67	"[{\\"id\\":\\"d9381046-47ab-4beb-850c-76632514e1f4\\",\\"variantId\\":151,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 21:31:34.431	2026-02-15 21:31:50.097	\N
9d665f1d-505c-442c-8b8a-3535bf0e1654	67	"[{\\"id\\":\\"e0371751-70f6-4069-aed9-090520f2ae49\\",\\"variantId\\":149,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":6,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 21:32:03.306	2026-02-15 21:32:11.521	\N
45c036d9-1187-4397-a9a3-dd35593e6ef5	67	"[{\\"id\\":\\"45bd063a-836e-4fde-9735-be297f99ecb2\\",\\"variantId\\":151,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 21:32:11.593	2026-02-15 21:33:28.279	\N
61261cfc-6eb5-4816-94a4-3e8c2e5d1de7	66	"[{\\"id\\":\\"85e1cf0e-cdc3-40a6-a236-c858ce376869\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 21:41:09.647	2026-02-15 21:42:21.252	\N
3dfe2b2a-9ea7-4789-8a63-4b79648da78e	67	"[{\\"id\\":\\"e02d1d8d-de9f-4625-b88a-21bf5c30cfdf\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 21:33:28.361	2026-02-15 21:42:48.371	\N
f0adc9ef-ea16-4540-8b82-799a8457460b	67	"[{\\"id\\":\\"d565f5f5-361b-43cb-bbfb-efed9598a9ae\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 21:42:48.464	2026-02-15 21:43:56.659	\N
e5620173-7042-4da5-b463-8937a8b8cdf4	66	"[{\\"id\\":\\"ea91a657-3c11-462d-b92b-437e5437079e\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"3302aaea-7cba-4b28-a302-766fcd4fc43e\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 21:42:21.312	2026-02-15 21:45:16.014	\N
e9341f9e-e852-4807-b531-fe047f7d3ac4	67	"[{\\"id\\":\\"8e5a7b9b-ae89-4091-9c02-36457be962cd\\",\\"variantId\\":119,\\"productId\\":89,\\"name\\":\\"Vodka Lemon - Standard\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 21:43:56.749	2026-02-15 21:46:11.084	\N
51edf193-f9a8-4e82-b1f8-7add59b6a9bf	66	"[{\\"id\\":\\"97ee4dd7-f7e9-4660-9ed5-8a84d6d59bb2\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 21:45:16.08	2026-02-15 21:46:14.833	\N
a569fe31-5df5-43b6-a9b8-944e9e653619	67	"[{\\"id\\":\\"cdb807bb-9f52-41d6-a073-8bee8d241241\\",\\"variantId\\":148,\\"productId\\":102,\\"name\\":\\"Birra Beck's - Standard\\",\\"price\\":4,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 21:48:26.06	2026-02-15 21:48:38.897	\N
84205e96-6dd9-405a-aa87-4309745b1080	67	"[{\\"id\\":\\"3c319e50-f67b-4d9d-83ba-068d3e20eda4\\",\\"variantId\\":151,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 21:48:38.975	2026-02-15 21:50:45.027	\N
d14638a8-06c9-475f-8d3a-87544aa61114	66	"[{\\"id\\":\\"0e872eb9-4caf-476c-87c9-900d2ba5e81f\\",\\"variantId\\":150,\\"productId\\":93,\\"name\\":\\"Gin Lemon - Standard\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"65b4ee1f-9635-4b76-ae9a-b40e7784c163\\",\\"variantId\\":148,\\"productId\\":102,\\"name\\":\\"Birra Beck's - Standard\\",\\"price\\":4,\\"quantity\\":4,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"a7316a42-b1ad-42ff-b3d0-e6793d7132e9\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":4,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"cb07c916-be69-44db-bcf3-484b17bb4b1b\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"591362a8-4594-4a87-a13c-f2c83545d478\\",\\"variantId\\":127,\\"productId\\":86,\\"name\\":\\"Pirlo Campari - Standard\\",\\"price\\":5,\\"quantity\\":4,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"943ca103-0e82-482c-a08e-0cfcf907e087\\",\\"variantId\\":149,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":6,\\"quantity\\":3,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"88d4787e-07c3-4b95-8f6f-605142721f24\\",\\"variantId\\":151,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"e954ae54-2420-4e91-8187-d9d1ce6b87ae\\",\\"variantId\\":169,\\"productId\\":96,\\"name\\":\\"Hierbas Shot - Standard\\",\\"price\\":3,\\"quantity\\":4,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 21:50:28.811	2026-02-16 19:05:11.012	\N
7943bbdb-f0aa-4eca-9d01-5d84e8e350c6	67	"[{\\"id\\":\\"3bbd9cd9-3d7c-4092-9727-25eabf61a088\\",\\"variantId\\":159,\\"productId\\":109,\\"name\\":\\"Becks FF - Standard\\",\\"price\\":3,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 21:46:11.153	2026-02-15 21:48:25.963	\N
bc0b779a-e151-4a67-a3c1-ddec0d34cbe1	66	"[{\\"id\\":\\"6ff507f8-6f1c-4ccd-8877-234d19f1395f\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 21:46:14.915	2026-02-15 21:48:28.388	\N
af1088cf-2732-433c-bc7d-b608d49a298e	66	"[{\\"id\\":\\"d4e55ca4-fb46-4979-8984-33d577eaed1b\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 21:48:28.463	2026-02-15 21:50:28.756	\N
7492a5bd-83d4-45f5-a372-98c33d6e5483	67	"[{\\"id\\":\\"26ad3e47-93ca-4c31-b23e-d1fdde9e69cc\\",\\"variantId\\":151,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 22:01:58.237	2026-02-15 22:05:07.445	\N
4a332c60-813b-4f8c-96ec-c00e64f8db1e	67	"[{\\"id\\":\\"4db2674b-0f0d-46de-948e-6b07a490b025\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 21:50:45.107	2026-02-15 21:50:51.04	\N
83c7c43c-48da-45f7-8de2-fcd4dda1c2b6	67	"[{\\"id\\":\\"db38cc8b-ce88-4b87-9ec1-ee3d68660887\\",\\"variantId\\":151,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 21:50:51.124	2026-02-15 21:52:43.909	\N
0912c399-b547-4bb6-8080-6203b9f391a6	67	"[{\\"id\\":\\"295f9363-3ab6-4cb6-9923-91a7920ded28\\",\\"variantId\\":151,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 21:52:44.01	2026-02-15 21:54:30.71	\N
a56cd6e8-dc31-4f82-a9eb-2c2cb4e8d4b2	67	"[{\\"id\\":\\"341ce8f6-3b2c-4954-af2b-908c7a021ce3\\",\\"variantId\\":151,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 22:05:07.53	2026-02-15 22:14:39.823	\N
22f7112a-7bf6-45eb-b835-1955bd34c517	67	"[{\\"id\\":\\"d8d90f9c-ae80-4199-9b40-e90514e474f4\\",\\"variantId\\":169,\\"productId\\":96,\\"name\\":\\"Hierbas Shot - Standard\\",\\"price\\":3,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 21:54:30.804	2026-02-15 21:54:38.549	\N
3d044a2c-5860-4ff6-86a3-c7200471db8c	67	"[{\\"id\\":\\"91965b36-cce2-43ef-bde1-0a66748d795c\\",\\"variantId\\":163,\\"productId\\":104,\\"name\\":\\"VL - Standard\\",\\"price\\":5,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 22:34:10.096	2026-02-15 22:36:44.103	\N
166f95fe-c1bd-4037-b1e1-14bc9a4545de	67	"[{\\"id\\":\\"360483c2-4166-407e-8226-fb93d2b558a7\\",\\"variantId\\":151,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 21:54:38.6	2026-02-15 21:59:09.201	\N
ad80a2ca-7b18-42d9-addb-bf89230ea00a	67	"[{\\"id\\":\\"40622de5-5751-4fd6-932e-35e374e1038e\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 22:14:39.913	2026-02-15 22:16:20.605	\N
e837bd00-9ec6-49f7-a30b-2d78cb91312b	67	"[{\\"id\\":\\"a1a6a95e-966e-47c9-899d-76618197cf09\\",\\"variantId\\":148,\\"productId\\":102,\\"name\\":\\"Birra Beck's - Standard\\",\\"price\\":4,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 21:59:09.315	2026-02-15 21:59:20.767	\N
ff10187d-b720-4641-982f-8311c923934a	67	"[{\\"id\\":\\"39285846-0149-44f7-baba-2dd673dc17e7\\",\\"variantId\\":127,\\"productId\\":86,\\"name\\":\\"Pirlo Campari - Standard\\",\\"price\\":5,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 21:59:20.86	2026-02-15 22:00:50.602	\N
63465ed8-67c7-4bcb-bf74-df29ce79d590	67	"[{\\"id\\":\\"e3ee8ebd-7f1e-4443-9f25-18ddb9fea9c5\\",\\"variantId\\":119,\\"productId\\":89,\\"name\\":\\"Vodka Lemon - Standard\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 22:16:20.693	2026-02-15 22:18:43.747	\N
8697f345-cc5e-4dcb-8287-4de852e82a5f	67	"[{\\"id\\":\\"b5b349f8-a6cf-4020-b6e8-1191d4261059\\",\\"variantId\\":127,\\"productId\\":86,\\"name\\":\\"Pirlo Campari - Standard\\",\\"price\\":5,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 22:00:50.675	2026-02-15 22:01:53.291	\N
34b90394-ded0-44cf-83c6-cc3bc8b4fde5	67	"[{\\"id\\":\\"b373435f-d58d-4ef6-b304-f61f52ce9e16\\",\\"variantId\\":149,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":6,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 22:01:53.379	2026-02-15 22:01:58.156	\N
947c2584-95af-4dc1-88ea-672aaa2051ce	67	"[{\\"id\\":\\"73ca8c07-0469-41df-98a7-82f2f82242d3\\",\\"variantId\\":148,\\"productId\\":102,\\"name\\":\\"Birra Beck's - Standard\\",\\"price\\":4,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-16 00:48:00.549	2026-02-16 01:16:06.348	\N
41988df4-84fd-4ba0-a411-74f917d8a337	67	"[{\\"id\\":\\"5c44e238-649f-481b-9320-3ec8e0fedfa8\\",\\"variantId\\":148,\\"productId\\":102,\\"name\\":\\"Birra Beck's - Standard\\",\\"price\\":4,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 22:18:43.846	2026-02-15 22:21:11.506	\N
bce7c0dd-da09-4f4e-a373-67894888dab2	67	"[{\\"id\\":\\"108a9bfa-062e-409a-9930-cbeae01ec696\\",\\"variantId\\":169,\\"productId\\":96,\\"name\\":\\"Hierbas Shot - Standard\\",\\"price\\":3,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 22:21:11.601	2026-02-15 22:24:01.754	\N
36fa1487-a7af-4183-af17-125336688003	67	"[{\\"id\\":\\"9951e2d5-a921-470b-81a3-ccbb54b377a4\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 22:36:44.192	2026-02-15 22:42:50.75	\N
180a2523-4da2-45ab-b683-7c03f21ebdd1	67	"[{\\"id\\":\\"69f51c00-8501-4a3c-8708-31e8c5722b67\\",\\"variantId\\":151,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 22:24:01.824	2026-02-15 22:26:45.458	\N
e89ab443-d139-4687-b7dd-d3b917da0795	67	"[{\\"id\\":\\"5a3f4593-33c2-4d99-ada6-c1b5e6fbb6cc\\",\\"variantId\\":169,\\"productId\\":96,\\"name\\":\\"Hierbas Shot - Standard\\",\\"price\\":3,\\"quantity\\":3,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 22:26:45.556	2026-02-15 22:34:10.013	\N
ac5821e2-a0a2-49c6-84dc-78d9d7779c6b	67	"[{\\"id\\":\\"67304249-0663-4ee3-b24e-7cce927023b9\\",\\"variantId\\":148,\\"productId\\":102,\\"name\\":\\"Birra Beck's - Standard\\",\\"price\\":4,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"e954ae54-2420-4e91-8187-d9d1ce6b87ae\\",\\"variantId\\":169,\\"productId\\":96,\\"name\\":\\"Hierbas Shot - Standard\\",\\"price\\":3,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 22:44:18.375	2026-02-16 00:48:00.453	\N
b6461e88-bc01-483e-a5f0-bd09ca285f42	67	"[{\\"id\\":\\"64fb8ab1-e460-4cf9-9606-da84a2319918\\",\\"variantId\\":169,\\"productId\\":96,\\"name\\":\\"Hierbas Shot - Standard\\",\\"price\\":3,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 22:42:50.857	2026-02-15 22:44:07.217	\N
e5a05fea-a4be-4dc4-8a37-f84d61aba414	67	"[{\\"id\\":\\"4dfb1e35-80b0-4ddf-9f38-8dd75e3cd567\\",\\"variantId\\":127,\\"productId\\":86,\\"name\\":\\"Pirlo Campari - Standard\\",\\"price\\":5,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-15 22:44:07.305	2026-02-15 22:44:18.296	\N
4c1b2f6f-020d-4faa-80c0-f16ce40863c2	67	"[]"	completed	2026-02-16 03:49:06.242	2026-02-16 05:17:07.19	\N
c79b90f3-5435-4291-96cb-f0771a4ddd1f	67	"[{\\"id\\":\\"2b416688-278a-4f40-b70d-eab0ade4ca89\\",\\"variantId\\":169,\\"productId\\":96,\\"name\\":\\"Hierbas Shot - Standard\\",\\"price\\":3,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-16 01:16:06.436	2026-02-16 03:49:06.14	\N
e47b5a9b-6b04-4ffa-8184-91db916769af	67	"[{\\"id\\":\\"7ba22933-40f1-4fe2-9343-8625e2a8575a\\",\\"variantId\\":149,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":6,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	pending_logout	2026-02-16 05:17:07.301	2026-02-16 19:34:57.252	2026-02-16 19:34:57.252
95eff6fd-41f2-40c8-97d0-d33d7ba6348b	66	"[{\\"id\\":\\"e28acadb-f259-4a4b-9335-e9d48b9d1f2d\\",\\"variantId\\":149,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":6,\\"quantity\\":5,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"9fb3f414-afad-4fb2-82d9-8c9965996816\\",\\"variantId\\":127,\\"productId\\":86,\\"name\\":\\"Pirlo Campari - Standard\\",\\"price\\":5,\\"quantity\\":6,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"43b565f5-fa60-4ea8-83ab-6b4c52d2911a\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":3,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"6d84bf8d-4c63-4222-a221-b88433f9226e\\",\\"variantId\\":148,\\"productId\\":102,\\"name\\":\\"Birra Beck's - Standard\\",\\"price\\":4,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"932a8641-9ef8-41ca-a7c9-fbe6367c53a8\\",\\"variantId\\":169,\\"productId\\":96,\\"name\\":\\"Hierbas Shot - Standard\\",\\"price\\":3,\\"quantity\\":5,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"6bd1e51c-c26e-45ff-b53b-351b21cf3643\\",\\"variantId\\":119,\\"productId\\":89,\\"name\\":\\"Vodka Lemon - Standard\\",\\"price\\":8,\\"quantity\\":5,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"dfdfa12e-dd32-4a3d-b086-d58ee77c79b4\\",\\"variantId\\":151,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":17,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"d4e64b76-610b-4411-96ce-8557a297e386\\",\\"variantId\\":150,\\"productId\\":93,\\"name\\":\\"Gin Lemon - Standard\\",\\"price\\":8,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-16 19:05:11.083	2026-02-16 19:05:27.995	\N
56c9b55f-f9af-4bec-b9f4-b4dd993e7e37	66	"[{\\"id\\":\\"b5200dff-d262-4740-a82d-5896e87e8c39\\",\\"variantId\\":149,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":6,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-16 19:05:28.069	2026-02-16 19:35:41.998	\N
74781551-a153-463c-a1c6-06acb9cc9d15	66	"[{\\"id\\":\\"33bd4f27-35e6-41e5-ac73-14272cb99a53\\",\\"variantId\\":149,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":6,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-16 19:35:42.162	2026-02-16 22:30:57.797	\N
5695dbc9-ec5a-45a1-a809-c0cf782581a3	66	"[{\\"id\\":\\"0f845f99-fcc9-4709-afc7-eab9050e657a\\",\\"variantId\\":148,\\"productId\\":102,\\"name\\":\\"Birra Beck's - Standard\\",\\"price\\":4,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-16 22:30:57.924	2026-02-18 20:10:13.342	\N
60945a14-e554-4d70-8151-38f83b2db7e4	66	"[{\\"id\\":\\"b99051c3-8547-4077-b31a-acea3a718643\\",\\"variantId\\":162,\\"productId\\":99,\\"name\\":\\"VT - Standard\\",\\"price\\":5,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"189d1d52-6ee4-4122-aea6-587ca9758542\\",\\"variantId\\":116,\\"productId\\":88,\\"name\\":\\"Lemonsoda - Standard\\",\\"price\\":3,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	completed	2026-02-18 20:10:13.407	2026-02-20 22:17:00.942	\N
0924a0da-5e5e-4f69-97b9-08495e550358	66	"[]"	active	2026-02-20 22:17:01.006	2026-02-20 22:17:01.006	\N
\.


--
-- Data for Name: product_variants; Type: TABLE DATA; Schema: public; Owner: totalevo_user
--

COPY public.product_variants (id, "productId", name, price, "isFavourite", "backgroundColor", "textColor") FROM stdin;
127	86	Standard	5	t	bg-red-600	text-white
128	84	Glass (150ml)	5	f	bg-yellow-500	text-white
129	84	Bottle	20	f	bg-yellow-400	text-slate-900
148	102	Standard	4	t	bg-amber-600	text-white
149	82	Bottle	6	t	bg-amber-600	text-white
153	103	Standard	1	f	bg-blue-800	text-white
162	99	Standard	5	f	bg-violet-800	text-white
163	104	Standard	5	f	bg-violet-800	text-white
166	87	Standard	3	f	bg-cyan-400	text-slate-900
167	101	Standard	3	f	bg-lime-700	text-white
168	95	Standard	3	t	bg-blue-800	text-white
119	89	Standard	8	t	bg-lime-300	text-slate-900
131	92	Standard	2	t	bg-slate-700	text-white
140	98	Standard	5	f	bg-teal-500	text-white
157	107	Standard	2	f	bg-slate-700	text-white
159	109	Standard	3	f	bg-green-800	text-white
164	94	Standard	0	t	bg-slate-700	text-white
165	106	Standard	2	f	bg-slate-700	text-white
169	96	Standard	3	t	bg-fuchsia-600	text-white
124	90	Standard	10	t	bg-rose-600	text-white
137	97	Standard	12	f	bg-slate-700	text-white
150	93	Standard	8	t	bg-yellow-300	text-slate-900
151	85	Standard	8	t	bg-yellow-300	text-slate-900
155	105	Standard	5	f	bg-green-800	text-white
160	110	Standard	4	f	bg-amber-600	text-white
138	83	Normale	8	t	bg-lime-700	text-white
161	108	Standard	3	f	bg-amber-400	text-slate-900
116	88	Standard	3	f	bg-green-800	text-white
126	91	Standard	10	t	bg-lime-300	text-slate-900
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: totalevo_user
--

COPY public.products (id, name, "categoryId") FROM stdin;
98	GT	86
102	Birra Beck's	81
93	Gin Lemon	82
103	H2O	86
87	Tonica	83
88	Lemonsoda	83
82	Birra Wuhrer	81
107	Hierbas Shot FF	86
109	Becks FF	86
108	White Wine FF	86
99	VT	86
104	VL	86
94	Gratis	84
106	Vodka Shot FF	86
101	Ginger Beer	83
89	Vodka Lemon	82
84	Vino Bianco	80
105	GL	86
110	Wuhrer FF	86
95	Vodka Shot	85
90	Tessera	84
83	Vodka & Tonic	82
96	Hierbas Shot	85
91	Biglietto	84
97	Sipsmith Tonica	82
85	Gin & Tonic	82
86	Pirlo Campari	82
92	Acqua Nat	83
\.


--
-- Data for Name: revoked_tokens; Type: TABLE DATA; Schema: public; Owner: totalevo_user
--

COPY public.revoked_tokens (id, "tokenDigest", "userId", "expiresAt", "createdAt", "revokedAt") FROM stdin;
\.


--
-- Data for Name: rooms; Type: TABLE DATA; Schema: public; Owner: totalevo_user
--

COPY public.rooms (id, name, description, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: totalevo_user
--

COPY public.settings (id, "taxMode", "autoStartTime", "lastManualClose", "businessDayEndHour") FROM stdin;
49	none	09:00	2026-01-23 17:11:59.013	06:00
\.


--
-- Data for Name: shared_layout_positions; Type: TABLE DATA; Schema: public; Owner: totalevo_user
--

COPY public.shared_layout_positions (id, "sharedLayoutId", "variantId", "gridColumn", "gridRow") FROM stdin;
\.


--
-- Data for Name: shared_layouts; Type: TABLE DATA; Schema: public; Owner: totalevo_user
--

COPY public.shared_layouts (id, name, "categoryId", "createdAt", "updatedAt", owner_id) FROM stdin;
\.


--
-- Data for Name: stock_adjustments; Type: TABLE DATA; Schema: public; Owner: totalevo_user
--

COPY public.stock_adjustments (id, "itemName", quantity, reason, "userId", "userName", "createdAt", "stockItemId") FROM stdin;
1	Vodka	3750	carico	66	Admin User	2026-01-23 17:28:23.169	5f67ee2e-f2a2-4f92-be40-5334d974378d
2	Tonic Water	12000	carico	66	Admin User	2026-01-23 17:28:58.958	408ce3ec-33a7-431d-860b-0abb733cda5b
3	H2O	89	fornitura	66	Admin User	2026-02-14 21:23:33.51	33bec996-f38d-438d-8898-6211910cd2e8
4	Vodka	5260	fornitura	66	Admin User	2026-02-14 21:26:11.082	5f67ee2e-f2a2-4f92-be40-5334d974378d
5	Birra Wuhrer	-16	bevute	66	Admin User	2026-02-14 21:46:16.022	85d837a1-1914-4ffc-baa5-16f31e7738cd
6	Ginger Beer	1	sbaglio a contare	66	Admin User	2026-02-14 21:46:33.122	1e450b1c-d6e8-4648-896d-92c1965b4c35
7	Tonic Water	16620	fornitura	66	Admin User	2026-02-14 21:49:15.32	408ce3ec-33a7-431d-860b-0abb733cda5b
8	Lemonsoda	7290	formitura	66	Admin User	2026-02-14 21:50:26.415	adaa5f1a-2955-47e9-840a-ec593e1aa8aa
9	Gordon's Gin	1600	fornitura	66	Admin User	2026-02-14 21:52:28.801	53c92360-363a-4715-bef4-5b1c733d1425
10	Sipsmith	700	fornitura	66	Admin User	2026-02-14 21:53:12.989	ea6dbfc7-866c-4290-af1a-bd0c23c7ecc3
11	Ginger Beer	4776	cambio item ingredient	66	Admin User	2026-02-14 21:59:41.255	1e450b1c-d6e8-4648-896d-92c1965b4c35
\.


--
-- Data for Name: stock_consumptions; Type: TABLE DATA; Schema: public; Owner: totalevo_user
--

COPY public.stock_consumptions (id, "variantId", quantity, "stockItemId") FROM stdin;
131	116	330	adaa5f1a-2955-47e9-840a-ec593e1aa8aa
135	119	150	adaa5f1a-2955-47e9-840a-ec593e1aa8aa
136	119	60	5f67ee2e-f2a2-4f92-be40-5334d974378d
141	127	40	3bf85438-f538-40a8-bb6e-3917bea6f456
142	127	80	f4f55e47-16ca-4b4a-9805-59535a0411b7
143	128	150	3bf85438-f538-40a8-bb6e-3917bea6f456
144	129	750	3bf85438-f538-40a8-bb6e-3917bea6f456
146	131	1	33bec996-f38d-438d-8898-6211910cd2e8
152	137	150	408ce3ec-33a7-431d-860b-0abb733cda5b
153	137	60	ea6dbfc7-866c-4290-af1a-bd0c23c7ecc3
154	138	60	5f67ee2e-f2a2-4f92-be40-5334d974378d
155	138	150	408ce3ec-33a7-431d-860b-0abb733cda5b
157	140	120	408ce3ec-33a7-431d-860b-0abb733cda5b
158	140	60	53c92360-363a-4715-bef4-5b1c733d1425
165	149	1	85d837a1-1914-4ffc-baa5-16f31e7738cd
166	150	150	adaa5f1a-2955-47e9-840a-ec593e1aa8aa
167	150	60	53c92360-363a-4715-bef4-5b1c733d1425
168	151	150	408ce3ec-33a7-431d-860b-0abb733cda5b
169	151	60	53c92360-363a-4715-bef4-5b1c733d1425
171	153	1	33bec996-f38d-438d-8898-6211910cd2e8
174	155	60	53c92360-363a-4715-bef4-5b1c733d1425
175	155	110	adaa5f1a-2955-47e9-840a-ec593e1aa8aa
177	157	30	95482dd4-014e-4dd1-b4ae-bf1111041fa1
179	159	1	d740d5a7-a45a-4a53-a968-7a44e4bd989a
180	160	1	85d837a1-1914-4ffc-baa5-16f31e7738cd
181	161	150	3bf85438-f538-40a8-bb6e-3917bea6f456
182	162	120	408ce3ec-33a7-431d-860b-0abb733cda5b
183	162	60	5f67ee2e-f2a2-4f92-be40-5334d974378d
184	163	60	5f67ee2e-f2a2-4f92-be40-5334d974378d
185	163	110	adaa5f1a-2955-47e9-840a-ec593e1aa8aa
186	165	30	5f67ee2e-f2a2-4f92-be40-5334d974378d
187	166	330	408ce3ec-33a7-431d-860b-0abb733cda5b
188	167	1	1e450b1c-d6e8-4648-896d-92c1965b4c35
189	168	30	5f67ee2e-f2a2-4f92-be40-5334d974378d
190	169	30	95482dd4-014e-4dd1-b4ae-bf1111041fa1
\.


--
-- Data for Name: stock_items; Type: TABLE DATA; Schema: public; Owner: totalevo_user
--

COPY public.stock_items (name, quantity, type, "baseUnit", "purchasingUnits", id) FROM stdin;
Birra Beck's	117	Sellable Good	pcs	"[{\\"id\\":\\"2406fe7f-f13f-47e9-a99a-1cb44a366af2\\",\\"name\\":\\"bottle\\",\\"multiplier\\":1},{\\"id\\":\\"16d26765-c38c-4a11-9296-a3b7de84c5cb\\",\\"name\\":\\"case\\",\\"multiplier\\":24}]"	d740d5a7-a45a-4a53-a968-7a44e4bd989a
Vino Bianco	8090	Ingredient	ml	"[{\\"id\\":\\"pu1\\",\\"name\\":\\"Bottle\\",\\"multiplier\\":750},{\\"id\\":\\"pu2\\",\\"name\\":\\"Case (12 Bottles)\\",\\"multiplier\\":9000}]"	3bf85438-f538-40a8-bb6e-3917bea6f456
Sipsmith	880	Ingredient	ml	"[]"	ea6dbfc7-866c-4290-af1a-bd0c23c7ecc3
Campari	7480	Ingredient	ml	"[{\\"id\\":\\"43e410d8-0330-4770-a61f-aeb42c40f453\\",\\"name\\":\\"Bottle\\",\\"multiplier\\":1000},{\\"id\\":\\"2279a216-12cf-4c0f-8f42-6d7f4e0ba7bf\\",\\"name\\":\\"Cassa\\",\\"multiplier\\":12000}]"	f4f55e47-16ca-4b4a-9805-59535a0411b7
Hierbas	1160	Ingredient	ml	"[]"	95482dd4-014e-4dd1-b4ae-bf1111041fa1
Gordon's Gin	6440	Ingredient	ml	"[{\\"id\\":\\"3a8992b3-8734-41c8-955e-22af7c2fcfb7\\",\\"name\\":\\"Bottle\\",\\"multiplier\\":1000},{\\"id\\":\\"86e650b1-c45c-4438-8a92-70d4bdecbe17\\",\\"name\\":\\"Cassa\\",\\"multiplier\\":6000}]"	53c92360-363a-4715-bef4-5b1c733d1425
Birra Wuhrer	6	Sellable Good	pcs	"[{\\"id\\":\\"pu3\\",\\"name\\":\\"Single\\",\\"multiplier\\":1},{\\"id\\":\\"pu5\\",\\"name\\":\\"Case (24)\\",\\"multiplier\\":24}]"	85d837a1-1914-4ffc-baa5-16f31e7738cd
H2O	98	Sellable Good	pcs	"[{\\"id\\":\\"136c437c-2e3c-45fa-93a1-d4a6788a803f\\",\\"name\\":\\"Cassa\\",\\"multiplier\\":24},{\\"id\\":\\"5a329205-b0f0-4c87-8a51-02a447d1843f\\",\\"name\\":\\"Half Dozen\\",\\"multiplier\\":6},{\\"id\\":\\"5b8bddea-7835-42d0-b11d-f9f211a2c7aa\\",\\"name\\":\\"singole\\",\\"multiplier\\":1}]"	33bec996-f38d-438d-8898-6211910cd2e8
Coca Cola	5	Sellable Good	pcs	"[{\\"id\\":\\"35ebfd10-dfc1-4ada-9320-a56b433f1496\\",\\"name\\":\\"cassa\\",\\"multiplier\\":24},{\\"id\\":\\"200be0e2-9b2f-4939-a8ad-d9c5bb3363bb\\",\\"name\\":\\"singola\\",\\"multiplier\\":1}]"	7722de39-a9e1-42a7-ac48-c7a9c82b12a0
Tonic Water	19130	Ingredient	ml	"[{\\"id\\":\\"pu7\\",\\"name\\":\\"Can (200ml)\\",\\"multiplier\\":200},{\\"id\\":\\"pu8\\",\\"name\\":\\"Bottle (1L)\\",\\"multiplier\\":100}]"	408ce3ec-33a7-431d-860b-0abb733cda5b
Vodka Moskovskaya	7000	Ingredient	ml	"[{\\"id\\":\\"pu6\\",\\"name\\":\\"Bottle (1 litro)\\",\\"multiplier\\":1000},{\\"id\\":\\"b4f90641-027a-4697-be64-46d5e078765b\\",\\"name\\":\\"cassa\\",\\"multiplier\\":6000}]"	5f67ee2e-f2a2-4f92-be40-5334d974378d
Lemonsoda	13120	Ingredient	ml	"[{\\"id\\":\\"1f0a03ff-d7a0-4880-95e2-1fb0e7a004cd\\",\\"name\\":\\"Lattina\\",\\"multiplier\\":330},{\\"id\\":\\"46177be4-3c33-4160-ba55-261e7106f586\\",\\"name\\":\\"Cassa\\",\\"multiplier\\":7920}]"	adaa5f1a-2955-47e9-840a-ec593e1aa8aa
Ginger Beer	4799	Ingredient	ml	"[{\\"id\\":\\"e2e39bbd-8c7b-4e5e-82ba-63d1a8b297eb\\",\\"name\\":\\"case\\",\\"multiplier\\":4800},{\\"id\\":\\"7052c23e-bd19-499e-bdb9-5d5970a7abef\\",\\"name\\":\\"bottle\\",\\"multiplier\\":200}]"	1e450b1c-d6e8-4648-896d-92c1965b4c35
\.


--
-- Data for Name: tables; Type: TABLE DATA; Schema: public; Owner: totalevo_user
--

COPY public.tables (id, name, x, y, width, height, status, "roomId", "createdAt", "updatedAt", items, capacity, owner_id) FROM stdin;
\.


--
-- Data for Name: tabs; Type: TABLE DATA; Schema: public; Owner: totalevo_user
--

COPY public.tabs (id, name, items, "createdAt", "tillId", "tillName", "tableId") FROM stdin;
\.


--
-- Data for Name: tills; Type: TABLE DATA; Schema: public; Owner: totalevo_user
--

COPY public.tills (id, name) FROM stdin;
64	Cassa
65	Bar
66	Pippo
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: totalevo_user
--

COPY public.transactions (id, items, subtotal, tax, tip, total, "paymentMethod", "userId", "userName", "tillId", "tillName", "createdAt", discount, "discountReason", status) FROM stdin;
254	"[{\\"id\\":\\"b99051c3-8547-4077-b31a-acea3a718643\\",\\"variantId\\":162,\\"productId\\":99,\\"name\\":\\"VT - Standard\\",\\"price\\":5,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"189d1d52-6ee4-4122-aea6-587ca9758542\\",\\"variantId\\":116,\\"productId\\":88,\\"name\\":\\"Lemonsoda - Standard\\",\\"price\\":3,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	8	0	0	0	Card	66	Admin User	65	Bar	2026-02-20 22:17:00.679	8	\N	complimentary
2	"[{\\"id\\":\\"057d8d71-f520-4c6d-847d-70557f6fa9de\\",\\"variantId\\":133,\\"productId\\":94,\\"name\\":\\"Gratis - Standard\\",\\"price\\":0.1,\\"quantity\\":3}]"	0.3	0	0	0.3	Cash	65	Cassa	64	Cassa	2025-12-31 21:48:10.489	0	\N	completed
3	"[{\\"id\\":\\"8b89f17c-8010-4e1a-85c6-0d144e70fa6a\\",\\"variantId\\":132,\\"productId\\":93,\\"name\\":\\"Gin Lemon - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	8	0	0	8	Cash	67	Bar	65	Bar	2025-12-31 22:24:58.523	0	\N	completed
4	"[{\\"id\\":\\"33e7c4b5-c071-40e4-863a-0fa11a2551b1\\",\\"variantId\\":132,\\"productId\\":93,\\"name\\":\\"Gin Lemon - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	8	0	0	8	Cash	67	Bar	65	Bar	2025-12-31 22:45:15.464	0	\N	completed
5	"[{\\"id\\":\\"3e2e4ddd-e862-4076-8a44-74d531ec2020\\",\\"variantId\\":137,\\"productId\\":97,\\"name\\":\\"Sipsmith Tonica - Standard\\",\\"price\\":12,\\"quantity\\":1}]"	12	0	0	12	Cash	67	Bar	65	Bar	2025-12-31 23:20:54.023	0	\N	completed
6	"[{\\"id\\":\\"fce82998-d574-4e53-90d9-9e768aebd1f7\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":2},{\\"id\\":\\"78ffe214-838a-4b8e-82ff-098ffd3f5265\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":4}]"	60	0	0	60	Cash	65	Cassa	64	Cassa	2025-12-31 23:35:53.93	0	\N	completed
7	"[{\\"id\\":\\"a615b353-8f90-458c-b1e5-45a6c563bba0\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1},{\\"id\\":\\"c0644ccf-9c95-4ffc-85f0-efe1733f5909\\",\\"variantId\\":127,\\"productId\\":86,\\"name\\":\\"Pirlo Campari - Standard\\",\\"price\\":5,\\"quantity\\":1}]"	10	0	0	10	Cash	67	Bar	65	Bar	2025-12-31 23:37:43.598	0	\N	completed
8	"[{\\"id\\":\\"b5f7c13e-c8a6-47fb-bb7a-13d317057e64\\",\\"variantId\\":115,\\"productId\\":87,\\"name\\":\\"Tonica - Standard\\",\\"price\\":3,\\"quantity\\":1}]"	3	0	0	3	Cash	67	Bar	65	Bar	2025-12-31 23:38:06.689	0	\N	completed
9	"[{\\"id\\":\\"d9106136-39bb-48c9-9fac-497837c767c4\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"47ff565b-d91b-4ee1-afb5-dabd0a78a321\\",\\"variantId\\":133,\\"productId\\":94,\\"name\\":\\"Gratis - Standard\\",\\"price\\":0.1,\\"quantity\\":1}]"	10.1	0	0	10.1	Cash	65	Cassa	64	Cassa	2025-12-31 23:43:50.201	0	\N	completed
10	"[{\\"id\\":\\"2b74554c-d5a0-4032-afea-eb00d80db251\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1}]"	2	0	0	2	Cash	67	Bar	65	Bar	2026-01-01 00:08:45.758	0	\N	completed
11	"[{\\"id\\":\\"5c3c0aae-3a2c-4f18-aaeb-59180a493711\\",\\"variantId\\":115,\\"productId\\":87,\\"name\\":\\"Tonica - Standard\\",\\"price\\":3,\\"quantity\\":2}]"	6	0	0	6	Cash	67	Bar	65	Bar	2026-01-01 00:11:12.945	0	\N	completed
12	"[{\\"id\\":\\"e357ebde-759c-4579-aded-5c31b96b90e2\\",\\"variantId\\":133,\\"productId\\":94,\\"name\\":\\"Gratis - Standard\\",\\"price\\":0.1,\\"quantity\\":1},{\\"id\\":\\"6dd13536-7c99-45c6-be58-01bc5a7dab0b\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":3},{\\"id\\":\\"ea3748fb-0164-498c-9291-0c2a4a56d386\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":4}]"	70.1	0	0	70.1	Cash	65	Cassa	64	Cassa	2026-01-01 00:15:35.113	0	\N	completed
13	"[{\\"id\\":\\"5800d649-b1a2-4da6-b390-f64cdf054d7b\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":2}]"	16	0	0	16	Cash	67	Bar	65	Bar	2026-01-01 00:17:59.52	0	\N	completed
14	"[{\\"id\\":\\"4831a6c6-1fd8-41a7-a167-2a043555fbf4\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"3533ddfc-cc51-4d36-9538-60a213b04675\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	20	0	0	20	Cash	65	Cassa	64	Cassa	2026-01-01 00:21:01.227	0	\N	completed
15	"[{\\"id\\":\\"b629d798-dccb-408b-bd4a-f1528d3375dd\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"4a796d1a-3197-441b-a2f1-7748cdbb50d9\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	20	0	0	20	Cash	65	Cassa	64	Cassa	2026-01-01 00:25:20.369	0	\N	completed
16	"[{\\"id\\":\\"9a82f13e-c5c6-487b-bdfc-04f563935780\\",\\"variantId\\":133,\\"productId\\":94,\\"name\\":\\"Gratis - Standard\\",\\"price\\":0.1,\\"quantity\\":1}]"	0.1	0	0	0.1	Cash	65	Cassa	64	Cassa	2026-01-01 00:25:57.676	0	\N	completed
17	"[{\\"id\\":\\"49711b0e-5c34-4bdc-9a6f-561beef1eec1\\",\\"variantId\\":133,\\"productId\\":94,\\"name\\":\\"Gratis - Standard\\",\\"price\\":0.1,\\"quantity\\":1}]"	0.1	0	0	0.1	Cash	65	Cassa	64	Cassa	2026-01-01 00:27:01.876	0	\N	completed
18	"[{\\"id\\":\\"92347468-1ee6-47cc-9bea-5b5e5b800cd2\\",\\"variantId\\":134,\\"productId\\":95,\\"name\\":\\"Vodka Shot - Standard\\",\\"price\\":3,\\"quantity\\":1}]"	3	0	0	3	Cash	67	Bar	65	Bar	2026-01-01 00:27:28.745	0	\N	completed
19	"[{\\"id\\":\\"fb735d8c-620d-4c09-928c-6696a9b6afb8\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":1},{\\"id\\":\\"1333c772-e47d-4acc-97e9-385e17170be5\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	16	0	0	16	Cash	67	Bar	65	Bar	2026-01-01 00:31:58.959	0	\N	completed
20	"[{\\"id\\":\\"7aabd676-4bcf-46b4-aca1-53dbbe0161cd\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":1}]"	8	0	0	8	Cash	67	Bar	65	Bar	2026-01-01 00:33:16.61	0	\N	completed
21	"[{\\"id\\":\\"0f18463e-aa39-49de-b4b2-442c5fe1843d\\",\\"variantId\\":127,\\"productId\\":86,\\"name\\":\\"Pirlo Campari - Standard\\",\\"price\\":5,\\"quantity\\":1}]"	5	0	0	5	Cash	67	Bar	65	Bar	2026-01-01 00:47:35.652	0	\N	completed
22	"[{\\"id\\":\\"4c27e59b-be87-4fc8-915f-179adf07d1f4\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	10	0	0	10	Cash	65	Cassa	64	Cassa	2026-01-01 00:53:56.933	0	\N	completed
23	"[{\\"id\\":\\"c5cac6b7-8e3d-4a00-b40b-e04ae2b3b899\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	10	0	0	10	Cash	65	Cassa	64	Cassa	2026-01-01 00:54:02.629	0	\N	completed
24	"[{\\"id\\":\\"af99ee18-465c-43c5-8543-a8fc3d7ecce3\\",\\"variantId\\":132,\\"productId\\":93,\\"name\\":\\"Gin Lemon - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	8	0	0	8	Cash	67	Bar	65	Bar	2026-01-01 01:00:54.359	0	\N	completed
25	"[{\\"id\\":\\"1f2c199e-e773-4ba5-aa2e-669ebdb8cbcc\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	10	0	0	10	Cash	65	Cassa	64	Cassa	2026-01-01 01:13:27.702	0	\N	completed
26	"[{\\"id\\":\\"cef2c475-bd10-4be3-9b65-bfc649948ba0\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":2},{\\"id\\":\\"03b92107-0a80-466b-8ab4-d237fee64842\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":2}]"	40	0	0	40	Cash	65	Cassa	64	Cassa	2026-01-01 01:19:33.951	0	\N	completed
27	"[{\\"id\\":\\"6c9c92f7-2af8-4b36-b34b-55f58b056a11\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	10	0	0	10	Cash	65	Cassa	64	Cassa	2026-01-01 01:19:46.72	0	\N	completed
28	"[{\\"id\\":\\"56d2a423-85dc-4bc7-8162-1e30b57c839c\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":2},{\\"id\\":\\"6d80c9c2-7c72-4dae-822c-0d6e333ad9ff\\",\\"variantId\\":132,\\"productId\\":93,\\"name\\":\\"Gin Lemon - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	24	0	0	24	Cash	67	Bar	65	Bar	2026-01-01 01:19:50.396	0	\N	completed
29	"[{\\"id\\":\\"b25f9dfc-0937-48ee-b6a8-6547fd1fb105\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"f82efafa-a580-4474-a4b6-9f5efc4df995\\",\\"variantId\\":133,\\"productId\\":94,\\"name\\":\\"Gratis - Standard\\",\\"price\\":0.1,\\"quantity\\":1}]"	10.1	0	0	10.1	Cash	65	Cassa	64	Cassa	2026-01-01 01:26:43.649	0	\N	completed
30	"[{\\"id\\":\\"ceedc478-faf0-4e10-8609-0a307d6f5f84\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"579582b9-a4f2-4a1e-8bf1-5dc59548076e\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	20	0	0	20	Cash	65	Cassa	64	Cassa	2026-01-01 01:35:18.153	0	\N	completed
31	"[{\\"id\\":\\"f86fdc55-52b9-46e7-89f5-1a9d38e25bc5\\",\\"variantId\\":133,\\"productId\\":94,\\"name\\":\\"Gratis - Standard\\",\\"price\\":0.1,\\"quantity\\":2},{\\"id\\":\\"72c11192-fae3-4cf5-94cb-2c19e84e4e5b\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	10.2	0	0	10.2	Cash	65	Cassa	64	Cassa	2026-01-01 01:39:30.947	0	\N	completed
32	"[{\\"id\\":\\"c96d633f-eed8-4b4c-a166-001af25881f0\\",\\"variantId\\":132,\\"productId\\":93,\\"name\\":\\"Gin Lemon - Standard\\",\\"price\\":8,\\"quantity\\":1},{\\"id\\":\\"a126cd5e-bf77-4e7e-83a9-4ca79358aed3\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1}]"	13	0	0	13	Cash	67	Bar	65	Bar	2026-01-01 01:42:51.715	0	\N	completed
33	"[{\\"id\\":\\"0aa6b312-66a3-45d8-9000-cf9669daf24d\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1},{\\"id\\":\\"cddd3b34-e765-48ad-9fc5-1e5cfcc99b9e\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	13	0	0	13	Cash	67	Bar	65	Bar	2026-01-01 01:42:59.395	0	\N	completed
34	"[{\\"id\\":\\"5d0eebfa-c38d-41bd-9e67-029ae93c980b\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"8850eb4a-6691-463b-9c66-057870b414f6\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	20	0	0	20	Cash	65	Cassa	64	Cassa	2026-01-01 01:45:08.66	0	\N	completed
35	"[{\\"id\\":\\"572ca598-dee9-4a65-9cd4-e887b89ae3e9\\",\\"variantId\\":132,\\"productId\\":93,\\"name\\":\\"Gin Lemon - Standard\\",\\"price\\":8,\\"quantity\\":2}]"	16	0	0	16	Cash	67	Bar	65	Bar	2026-01-01 01:50:15.513	0	\N	completed
36	"[{\\"id\\":\\"6c94ca77-be3b-438b-a8dd-69ec611f45de\\",\\"variantId\\":132,\\"productId\\":93,\\"name\\":\\"Gin Lemon - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	8	0	0	8	Cash	67	Bar	65	Bar	2026-01-01 01:50:20.457	0	\N	completed
37	"[{\\"id\\":\\"9718b246-c757-40a8-ad66-2b97e1e91544\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"fa23b9e7-e9d8-46db-8b59-a022911aa2f3\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	20	0	0	20	Cash	65	Cassa	64	Cassa	2026-01-01 01:51:02.511	0	\N	completed
38	"[{\\"id\\":\\"97f740ec-c814-49e0-88a6-a5779da810b2\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"0bfcf492-ccd7-495c-a87c-ac9afc062904\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	20	0	0	20	Cash	65	Cassa	64	Cassa	2026-01-01 01:54:07.742	0	\N	completed
39	"[{\\"id\\":\\"eb9b8266-ddcf-44e4-a4f5-8aa555caaaa6\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	8	0	0	8	Cash	67	Bar	65	Bar	2026-01-01 01:55:29.244	0	\N	completed
40	"[{\\"id\\":\\"ff74d197-cffa-4348-8dd1-1bdb8fcad6eb\\",\\"variantId\\":132,\\"productId\\":93,\\"name\\":\\"Gin Lemon - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	8	0	0	8	Cash	67	Bar	65	Bar	2026-01-01 01:56:33.25	0	\N	completed
41	"[{\\"id\\":\\"b5c4164d-16b8-4d2b-8b1f-df639198d27b\\",\\"variantId\\":132,\\"productId\\":93,\\"name\\":\\"Gin Lemon - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	8	0	0	8	Cash	67	Bar	65	Bar	2026-01-01 01:59:00.271	0	\N	completed
42	"[{\\"id\\":\\"b3b2202c-a642-4e67-b49b-f1ba6c36fe71\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"ddf3d37c-3341-49bc-a3d6-ffad7bfb0222\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	20	0	0	20	Cash	65	Cassa	64	Cassa	2026-01-01 01:59:01.734	0	\N	completed
43	"[{\\"id\\":\\"63993265-f6bb-479c-8184-46e411442828\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"2b378570-8aac-4128-9310-9c2512c36a66\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	20	0	0	20	Cash	65	Cassa	64	Cassa	2026-01-01 01:59:12.713	0	\N	completed
44	"[{\\"id\\":\\"f138f4f3-d852-468d-bbd3-431d1b614e8f\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"7e4cb287-a07c-45c5-90f1-ff42f5a6d8f1\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	20	0	0	20	Cash	65	Cassa	64	Cassa	2026-01-01 02:05:21.065	0	\N	completed
45	"[{\\"id\\":\\"70757cf3-e873-4911-b5c2-981607a42210\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"c97adafb-b08a-4536-9482-f4ca17cf6f6c\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	20	0	0	20	Cash	65	Cassa	64	Cassa	2026-01-01 02:06:16.515	0	\N	completed
46	"[{\\"id\\":\\"dd1b9378-6c91-4a7e-b471-b7891321094e\\",\\"variantId\\":132,\\"productId\\":93,\\"name\\":\\"Gin Lemon - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	8	0	0	8	Cash	67	Bar	65	Bar	2026-01-01 02:07:38.987	0	\N	completed
47	"[{\\"id\\":\\"6ef1fec7-1584-4850-a926-c13517e6a656\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	8	0	0	8	Cash	67	Bar	65	Bar	2026-01-01 02:08:10.585	0	\N	completed
48	"[{\\"id\\":\\"0e543759-6974-48eb-958e-b5a51bd07d06\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"02f2e3dd-80a5-4898-9eaf-27c5e0a47b9f\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	20	0	0	20	Cash	65	Cassa	64	Cassa	2026-01-01 02:08:53.511	0	\N	completed
49	"[{\\"id\\":\\"66d55913-0ae7-439f-b58b-03b2dd9c46c4\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"cc898c03-2d47-4767-b538-0b9773c6596b\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	20	0	0	20	Cash	65	Cassa	64	Cassa	2026-01-01 02:09:22.923	0	\N	completed
50	"[{\\"id\\":\\"cbf43328-262e-4ecf-98e3-4fe2c1f8b099\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"2b04b2ae-0754-4cd1-ba85-d26d31080407\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	20	0	0	20	Cash	65	Cassa	64	Cassa	2026-01-01 02:10:36.632	0	\N	completed
51	"[{\\"id\\":\\"f9668e48-d15b-453b-939a-60f2f6e6d9ac\\",\\"variantId\\":132,\\"productId\\":93,\\"name\\":\\"Gin Lemon - Standard\\",\\"price\\":8,\\"quantity\\":2}]"	16	0	0	16	Cash	67	Bar	65	Bar	2026-01-01 02:10:43.995	0	\N	completed
52	"[{\\"id\\":\\"f8a50d50-5006-4285-8365-e2d38f2b5464\\",\\"variantId\\":132,\\"productId\\":93,\\"name\\":\\"Gin Lemon - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	8	0	0	8	Cash	67	Bar	65	Bar	2026-01-01 02:11:54.885	0	\N	completed
53	"[{\\"id\\":\\"24f6b452-2480-424e-abce-0b7a9d8e470b\\",\\"variantId\\":132,\\"productId\\":93,\\"name\\":\\"Gin Lemon - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	8	0	0	8	Cash	67	Bar	65	Bar	2026-01-01 02:12:00.279	0	\N	completed
54	"[{\\"id\\":\\"edb7509e-4f3b-4c44-ae3b-617f39d1b175\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"abeb3837-05cd-4b2c-b702-d2269a61c409\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	20	0	0	20	Cash	65	Cassa	64	Cassa	2026-01-01 02:12:43.726	0	\N	completed
55	"[{\\"id\\":\\"0aa94e13-9bee-4961-9c3a-7141665b0d26\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":1}]"	8	0	0	8	Cash	67	Bar	65	Bar	2026-01-01 02:13:47.326	0	\N	completed
56	"[{\\"id\\":\\"4ab151ad-a348-482f-b84a-9c5aaaa8ed9f\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	8	0	0	8	Cash	67	Bar	65	Bar	2026-01-01 02:17:30.742	0	\N	completed
57	"[{\\"id\\":\\"a7c61de6-de35-45de-bd8b-84748d30b014\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":4}]"	32	0	0	32	Cash	67	Bar	65	Bar	2026-01-01 02:21:35.223	0	\N	completed
58	"[{\\"id\\":\\"70c4a305-89bd-4bbd-81fd-250169c8809e\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	8	0	0	8	Cash	67	Bar	65	Bar	2026-01-01 02:23:59.174	0	\N	completed
59	"[{\\"id\\":\\"5c297a39-e1e7-4583-847d-fb3a73889dd3\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1}]"	5	0	0	5	Cash	67	Bar	65	Bar	2026-01-01 02:28:50.312	0	\N	completed
60	"[{\\"id\\":\\"b597dca9-5dd2-43bd-92f1-9531d722689b\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":1}]"	8	0	0	8	Cash	67	Bar	65	Bar	2026-01-01 02:31:56.62	0	\N	completed
61	"[{\\"id\\":\\"06951a8d-17fd-4a0e-ad30-f17c799d1f9f\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":1}]"	8	0	0	8	Cash	67	Bar	65	Bar	2026-01-01 02:32:03.723	0	\N	completed
62	"[{\\"id\\":\\"6c2181c9-8768-4716-9cae-f7d00deeddb3\\",\\"variantId\\":132,\\"productId\\":93,\\"name\\":\\"Gin Lemon - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	8	0	0	8	Cash	67	Bar	65	Bar	2026-01-01 02:36:25.45	0	\N	completed
63	"[{\\"id\\":\\"c5be0b67-8fd1-440d-97ef-d9a6b357df0b\\",\\"variantId\\":134,\\"productId\\":95,\\"name\\":\\"Vodka Shot - Standard\\",\\"price\\":3,\\"quantity\\":2}]"	6	0	0	6	Cash	67	Bar	65	Bar	2026-01-01 02:39:26.714	0	\N	completed
64	"[{\\"id\\":\\"cfc04c91-c0a0-4802-8219-9f44df008f00\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1}]"	2	0	0	2	Cash	67	Bar	65	Bar	2026-01-01 02:40:44.885	0	\N	completed
65	"[{\\"id\\":\\"179b14b9-b101-42ec-bd79-f994ef0a3e5c\\",\\"variantId\\":132,\\"productId\\":93,\\"name\\":\\"Gin Lemon - Standard\\",\\"price\\":8,\\"quantity\\":1},{\\"id\\":\\"b543c036-f492-4402-9fcb-96c89365cf47\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1}]"	10	0	0	10	Cash	67	Bar	65	Bar	2026-01-01 02:53:48.63	0	\N	completed
68	"[{\\"id\\":\\"74973007-63c8-4171-83cf-4142ac4b420c\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":5,\\"effectiveTaxRate\\":0},{\\"id\\":\\"ce0f9497-f0f7-485b-bb88-c53782019ccd\\",\\"variantId\\":134,\\"productId\\":95,\\"name\\":\\"Vodka Shot - Standard\\",\\"price\\":3,\\"quantity\\":10,\\"effectiveTaxRate\\":0},{\\"id\\":\\"b5224ab5-1f8c-40d1-b850-4af61fe5e2b7\\",\\"variantId\\":115,\\"productId\\":87,\\"name\\":\\"Tonica - Standard\\",\\"price\\":3,\\"quantity\\":1,\\"effectiveTaxRate\\":0},{\\"id\\":\\"7221ff64-8a66-479a-b746-041a2b473c0d\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":3,\\"effectiveTaxRate\\":0},{\\"id\\":\\"30169206-a2ae-4253-ab52-dc78df61fbc4\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0},{\\"id\\":\\"8047e400-571d-473d-8bf1-e4a894c58665\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":3,\\"effectiveTaxRate\\":0},{\\"id\\":\\"6300523a-6351-4653-8976-2e536dd37c84\\",\\"variantId\\":127,\\"productId\\":86,\\"name\\":\\"Pirlo Campari - Standard\\",\\"price\\":5,\\"quantity\\":1,\\"effectiveTaxRate\\":0}]"	101	0	0	101	Cash	65	Cassa	64	Cassa	2026-01-23 16:59:20.341	0	\N	completed
69	"[{\\"id\\":\\"74973007-63c8-4171-83cf-4142ac4b420c\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":5,\\"effectiveTaxRate\\":0},{\\"id\\":\\"ce0f9497-f0f7-485b-bb88-c53782019ccd\\",\\"variantId\\":134,\\"productId\\":95,\\"name\\":\\"Vodka Shot - Standard\\",\\"price\\":3,\\"quantity\\":10,\\"effectiveTaxRate\\":0},{\\"id\\":\\"b5224ab5-1f8c-40d1-b850-4af61fe5e2b7\\",\\"variantId\\":115,\\"productId\\":87,\\"name\\":\\"Tonica - Standard\\",\\"price\\":3,\\"quantity\\":1,\\"effectiveTaxRate\\":0},{\\"id\\":\\"7221ff64-8a66-479a-b746-041a2b473c0d\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":3,\\"effectiveTaxRate\\":0},{\\"id\\":\\"30169206-a2ae-4253-ab52-dc78df61fbc4\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0},{\\"id\\":\\"8047e400-571d-473d-8bf1-e4a894c58665\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":3,\\"effectiveTaxRate\\":0},{\\"id\\":\\"6300523a-6351-4653-8976-2e536dd37c84\\",\\"variantId\\":127,\\"productId\\":86,\\"name\\":\\"Pirlo Campari - Standard\\",\\"price\\":5,\\"quantity\\":1,\\"effectiveTaxRate\\":0}]"	101	0	0	101	Cash	65	Cassa	64	Cassa	2026-01-23 16:59:28.678	0	\N	completed
85	"[{\\"id\\":\\"e78d4c95-ca18-4934-bfe0-a2e101be77fb\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1},{\\"id\\":\\"8e7f5900-6e3f-43cf-af7a-bddc248c7bf5\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1}]"	7	0	0	7	Cash	67	Bar	65	Bar	2026-01-24 22:39:23.005	0	\N	completed
70	"[{\\"id\\":\\"74973007-63c8-4171-83cf-4142ac4b420c\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":5,\\"effectiveTaxRate\\":0},{\\"id\\":\\"ce0f9497-f0f7-485b-bb88-c53782019ccd\\",\\"variantId\\":134,\\"productId\\":95,\\"name\\":\\"Vodka Shot - Standard\\",\\"price\\":3,\\"quantity\\":10,\\"effectiveTaxRate\\":0},{\\"id\\":\\"b5224ab5-1f8c-40d1-b850-4af61fe5e2b7\\",\\"variantId\\":115,\\"productId\\":87,\\"name\\":\\"Tonica - Standard\\",\\"price\\":3,\\"quantity\\":1,\\"effectiveTaxRate\\":0},{\\"id\\":\\"7221ff64-8a66-479a-b746-041a2b473c0d\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":3,\\"effectiveTaxRate\\":0},{\\"id\\":\\"30169206-a2ae-4253-ab52-dc78df61fbc4\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0},{\\"id\\":\\"8047e400-571d-473d-8bf1-e4a894c58665\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":3,\\"effectiveTaxRate\\":0},{\\"id\\":\\"6300523a-6351-4653-8976-2e536dd37c84\\",\\"variantId\\":127,\\"productId\\":86,\\"name\\":\\"Pirlo Campari - Standard\\",\\"price\\":5,\\"quantity\\":1,\\"effectiveTaxRate\\":0}]"	101	0	0	101	Cash	65	Cassa	64	Cassa	2026-01-23 16:59:55.948	0	\N	completed
88	"[{\\"id\\":\\"21d70d8f-b416-4849-a363-d3b54db7a848\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	8	0	0	8	Cash	67	Bar	65	Bar	2026-01-24 22:45:43.175	0	\N	completed
89	"[{\\"id\\":\\"21d70d8f-b416-4849-a363-d3b54db7a848\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	8	0	0	8	Cash	67	Bar	65	Bar	2026-01-24 22:45:43.922	0	\N	completed
90	"[{\\"id\\":\\"ac2f0665-5e84-4c1a-b66d-debfd53bc3ef\\",\\"variantId\\":119,\\"productId\\":89,\\"name\\":\\"Vodka Lemon - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	8	0	0	8	Cash	67	Bar	65	Bar	2026-01-24 22:48:00.124	0	\N	completed
71	"[{\\"id\\":\\"74973007-63c8-4171-83cf-4142ac4b420c\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":5,\\"effectiveTaxRate\\":0},{\\"id\\":\\"ce0f9497-f0f7-485b-bb88-c53782019ccd\\",\\"variantId\\":134,\\"productId\\":95,\\"name\\":\\"Vodka Shot - Standard\\",\\"price\\":3,\\"quantity\\":10,\\"effectiveTaxRate\\":0},{\\"id\\":\\"b5224ab5-1f8c-40d1-b850-4af61fe5e2b7\\",\\"variantId\\":115,\\"productId\\":87,\\"name\\":\\"Tonica - Standard\\",\\"price\\":3,\\"quantity\\":1,\\"effectiveTaxRate\\":0},{\\"id\\":\\"7221ff64-8a66-479a-b746-041a2b473c0d\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":3,\\"effectiveTaxRate\\":0},{\\"id\\":\\"30169206-a2ae-4253-ab52-dc78df61fbc4\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0},{\\"id\\":\\"8047e400-571d-473d-8bf1-e4a894c58665\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":3,\\"effectiveTaxRate\\":0},{\\"id\\":\\"6300523a-6351-4653-8976-2e536dd37c84\\",\\"variantId\\":127,\\"productId\\":86,\\"name\\":\\"Pirlo Campari - Standard\\",\\"price\\":5,\\"quantity\\":1,\\"effectiveTaxRate\\":0}]"	101	0	0	101	Cash	65	Cassa	64	Cassa	2026-01-23 17:01:39.298	0	\N	completed
72	"[{\\"id\\":\\"74973007-63c8-4171-83cf-4142ac4b420c\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":5,\\"effectiveTaxRate\\":0},{\\"id\\":\\"ce0f9497-f0f7-485b-bb88-c53782019ccd\\",\\"variantId\\":134,\\"productId\\":95,\\"name\\":\\"Vodka Shot - Standard\\",\\"price\\":3,\\"quantity\\":10,\\"effectiveTaxRate\\":0},{\\"id\\":\\"b5224ab5-1f8c-40d1-b850-4af61fe5e2b7\\",\\"variantId\\":115,\\"productId\\":87,\\"name\\":\\"Tonica - Standard\\",\\"price\\":3,\\"quantity\\":1,\\"effectiveTaxRate\\":0},{\\"id\\":\\"7221ff64-8a66-479a-b746-041a2b473c0d\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":3,\\"effectiveTaxRate\\":0},{\\"id\\":\\"30169206-a2ae-4253-ab52-dc78df61fbc4\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0},{\\"id\\":\\"8047e400-571d-473d-8bf1-e4a894c58665\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":3,\\"effectiveTaxRate\\":0},{\\"id\\":\\"6300523a-6351-4653-8976-2e536dd37c84\\",\\"variantId\\":127,\\"productId\\":86,\\"name\\":\\"Pirlo Campari - Standard\\",\\"price\\":5,\\"quantity\\":1,\\"effectiveTaxRate\\":0}]"	101	0	0	101	Cash	67	Bar	65	Bar	2026-01-23 17:05:43.027	0	\N	completed
73	"[{\\"id\\":\\"fbd4ed0b-9a44-4cc9-b869-61af65543b05\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"7a52fbbe-f84b-4c0a-b8c4-b8ebb5889b73\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	20	0	0	20	Cash	66	Admin User	64	Cassa	2026-01-23 17:10:47.069	0	\N	completed
74	"[{\\"id\\":\\"74973007-63c8-4171-83cf-4142ac4b420c\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":5,\\"effectiveTaxRate\\":0},{\\"id\\":\\"ce0f9497-f0f7-485b-bb88-c53782019ccd\\",\\"variantId\\":134,\\"productId\\":95,\\"name\\":\\"Vodka Shot - Standard\\",\\"price\\":3,\\"quantity\\":10,\\"effectiveTaxRate\\":0},{\\"id\\":\\"b5224ab5-1f8c-40d1-b850-4af61fe5e2b7\\",\\"variantId\\":115,\\"productId\\":87,\\"name\\":\\"Tonica - Standard\\",\\"price\\":3,\\"quantity\\":1,\\"effectiveTaxRate\\":0},{\\"id\\":\\"7221ff64-8a66-479a-b746-041a2b473c0d\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":3,\\"effectiveTaxRate\\":0},{\\"id\\":\\"30169206-a2ae-4253-ab52-dc78df61fbc4\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0},{\\"id\\":\\"8047e400-571d-473d-8bf1-e4a894c58665\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":3,\\"effectiveTaxRate\\":0},{\\"id\\":\\"6300523a-6351-4653-8976-2e536dd37c84\\",\\"variantId\\":127,\\"productId\\":86,\\"name\\":\\"Pirlo Campari - Standard\\",\\"price\\":5,\\"quantity\\":1,\\"effectiveTaxRate\\":0}]"	101	0	0	101	Cash	66	Admin User	64	Cassa	2026-01-23 17:26:15.332	0	\N	completed
75	"[{\\"id\\":\\"912a984f-e920-4fbe-9baa-480a035730a2\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	10	0	0	10	Cash	65	Cassa	64	Cassa	2026-01-24 19:31:14.813	0	\N	completed
76	"[{\\"id\\":\\"21388ade-8b67-411d-a464-612b515e72cb\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"56593332-8a24-403a-81ce-67a106149f82\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":3}]"	40	0	0	40	Cash	65	Cassa	64	Cassa	2026-01-24 21:10:56.734	0	\N	completed
77	"[{\\"id\\":\\"389eb0f1-2c4d-4dc4-95ae-963015689119\\",\\"variantId\\":133,\\"productId\\":94,\\"name\\":\\"Gratis - Standard\\",\\"price\\":0.1,\\"quantity\\":2}]"	0.2	0	0	0.2	Cash	65	Cassa	64	Cassa	2026-01-24 21:11:06.206	0	\N	completed
78	"[{\\"id\\":\\"d3ec4dec-9120-4c94-a413-2ad6d8088c66\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"a6c3891f-8f1d-44fa-839b-c5a38e546c12\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	20	0	0	20	Cash	65	Cassa	64	Cassa	2026-01-24 21:21:02.924	0	\N	completed
79	"[{\\"id\\":\\"7f0a1b03-b71a-4d77-ae94-95bb336df73e\\",\\"variantId\\":116,\\"productId\\":88,\\"name\\":\\"Lemonsoda - Standard\\",\\"price\\":3,\\"quantity\\":1}]"	3	0	0	3	Cash	67	Bar	65	Bar	2026-01-24 21:42:56.291	0	\N	completed
80	"[{\\"id\\":\\"9b5b1917-97b0-4657-b3c1-2fa226794252\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":3},{\\"id\\":\\"786ce2ca-5f06-4194-b438-8271aae8f8d9\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":2}]"	50	0	0	50	Cash	65	Cassa	64	Cassa	2026-01-24 21:43:28.584	0	\N	completed
81	"[{\\"id\\":\\"d0dce334-496a-4b24-9c87-364a6f88a69a\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	10	0	0	10	Cash	65	Cassa	64	Cassa	2026-01-24 21:48:31.902	0	\N	completed
82	"[{\\"id\\":\\"ebbcb548-cbdf-40e9-9682-65a8ca5d3846\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"4fb0c7d2-73fc-4fc8-8b42-5b502157ae7c\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":2}]"	30	0	0	30	Cash	65	Cassa	64	Cassa	2026-01-24 22:11:20.852	0	\N	completed
83	"[{\\"id\\":\\"d84f3a78-3307-42b8-9e1b-96aba1536553\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	10	0	0	10	Cash	65	Cassa	64	Cassa	2026-01-24 22:12:51.755	0	\N	completed
84	"[{\\"id\\":\\"deae7a01-cf77-466b-a290-aff91dd8763c\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1}]"	5	0	0	5	Cash	67	Bar	65	Bar	2026-01-24 22:27:41.029	0	\N	completed
86	"[{\\"id\\":\\"a2efe2b2-7895-4dee-aff6-de697fcaf839\\",\\"variantId\\":115,\\"productId\\":87,\\"name\\":\\"Tonica - Standard\\",\\"price\\":3,\\"quantity\\":1}]"	3	0	0	3	Cash	67	Bar	65	Bar	2026-01-24 22:40:09.071	0	\N	completed
87	"[{\\"id\\":\\"e43d05ed-b20a-421c-b57c-0d4b147efc5a\\",\\"variantId\\":134,\\"productId\\":95,\\"name\\":\\"Vodka Shot - Standard\\",\\"price\\":3,\\"quantity\\":1}]"	3	0	0	3	Cash	67	Bar	65	Bar	2026-01-24 22:41:54.843	0	\N	completed
91	"[{\\"id\\":\\"36db61ce-68d6-4dd1-8cd1-5f1e66a26e48\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1}]"	5	0	0	5	Cash	67	Bar	65	Bar	2026-01-24 23:02:19.263	0	\N	completed
92	"[{\\"id\\":\\"d3bb9d25-0120-4f12-995c-884a02c2094c\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":2}]"	16	0	0	16	Cash	67	Bar	65	Bar	2026-01-24 23:19:10.812	0	\N	completed
93	"[{\\"id\\":\\"70154fbf-e588-47cc-bd5e-1e4591f36370\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	8	0	0	8	Cash	67	Bar	65	Bar	2026-01-24 23:19:58.325	0	\N	completed
94	"[{\\"id\\":\\"3218a20a-947e-49dc-b681-65a4436c8f19\\",\\"variantId\\":115,\\"productId\\":87,\\"name\\":\\"Tonica - Standard\\",\\"price\\":3,\\"quantity\\":1}]"	3	0	0	3	Cash	67	Bar	65	Bar	2026-01-24 23:20:26.37	0	\N	completed
95	"[{\\"id\\":\\"bfe24095-90c6-426d-8fd5-fde9ba4dffa5\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":2},{\\"id\\":\\"bada680f-f01d-4236-9eb8-a68e61bb2aab\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":3}]"	50	0	0	50	Cash	65	Cassa	64	Cassa	2026-01-24 23:25:25.547	0	\N	completed
96	"[{\\"id\\":\\"d668ab0d-1801-49a8-88bd-348a4a61e456\\",\\"variantId\\":132,\\"productId\\":93,\\"name\\":\\"Gin Lemon - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	8	0	0	8	Cash	67	Bar	65	Bar	2026-01-24 23:27:12.318	0	\N	completed
97	"[{\\"id\\":\\"d3ac2465-80cb-49b2-8f82-f1d5116aeffb\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	8	0	0	8	Cash	67	Bar	65	Bar	2026-01-24 23:27:22.045	0	\N	completed
98	"[{\\"id\\":\\"460696cc-50d3-4246-b100-7e07ac350b9c\\",\\"variantId\\":134,\\"productId\\":95,\\"name\\":\\"Vodka Shot - Standard\\",\\"price\\":3,\\"quantity\\":1}]"	3	0	0	3	Cash	67	Bar	65	Bar	2026-01-24 23:27:32.949	0	\N	completed
99	"[{\\"id\\":\\"52094709-64ca-4d61-8f61-c11212e39f07\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1}]"	2	0	0	2	Cash	67	Bar	65	Bar	2026-01-24 23:42:27.619	0	\N	completed
100	"[{\\"id\\":\\"fa182ef2-9e1f-4fbd-8fe8-12ad89bfb689\\",\\"variantId\\":137,\\"productId\\":97,\\"name\\":\\"Sipsmith Tonica - Standard\\",\\"price\\":12,\\"quantity\\":1}]"	12	0	0	12	Cash	67	Bar	65	Bar	2026-01-24 23:52:20.025	0	\N	completed
101	"[{\\"id\\":\\"8a36fb24-a23d-434d-8a9b-bed427ccac81\\",\\"variantId\\":135,\\"productId\\":96,\\"name\\":\\"Hierbas Shot - Standard\\",\\"price\\":3,\\"quantity\\":3}]"	9	0	0	9	Cash	67	Bar	65	Bar	2026-01-24 23:56:37.925	0	\N	completed
102	"[{\\"id\\":\\"00fc1d21-2125-44cb-963a-06d3f2380ac1\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	8	0	0	8	Cash	67	Bar	65	Bar	2026-01-25 00:02:33.862	0	\N	completed
103	"[{\\"id\\":\\"f85fd321-c33a-4337-8077-1f5d49661880\\",\\"variantId\\":135,\\"productId\\":96,\\"name\\":\\"Hierbas Shot - Standard\\",\\"price\\":3,\\"quantity\\":4}]"	12	0	0	12	Cash	67	Bar	65	Bar	2026-01-25 00:10:00.338	0	\N	completed
104	"[{\\"id\\":\\"63f88a34-5b76-4cbc-98ce-2c3737a10ff0\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1}]"	5	0	0	5	Cash	67	Bar	65	Bar	2026-01-25 00:14:34.723	0	\N	completed
105	"[{\\"id\\":\\"133e0c52-8585-4099-b752-09f2f2b3d825\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":2}]"	10	0	0	10	Cash	67	Bar	65	Bar	2026-01-25 00:50:52.496	0	\N	completed
106	"[{\\"id\\":\\"51005452-ddbc-4476-9a94-44ee529d63ac\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1}]"	5	0	0	5	Cash	67	Bar	65	Bar	2026-01-25 00:53:37.067	0	\N	completed
107	"[{\\"id\\":\\"f432c99d-f5b7-425e-9c14-65a7b48d4df5\\",\\"variantId\\":134,\\"productId\\":95,\\"name\\":\\"Vodka Shot - Standard\\",\\"price\\":3,\\"quantity\\":2}]"	6	0	0	6	Cash	67	Bar	65	Bar	2026-01-25 01:05:06.436	0	\N	completed
108	"[{\\"id\\":\\"7d9c9cf3-1ad2-4b33-8c35-a129c22f8c41\\",\\"variantId\\":135,\\"productId\\":96,\\"name\\":\\"Hierbas Shot - Standard\\",\\"price\\":3,\\"quantity\\":1}]"	3	0	0	3	Cash	67	Bar	65	Bar	2026-01-25 01:05:13.817	0	\N	completed
109	"[{\\"id\\":\\"6265b7fd-720a-48be-ad2a-506552fd2e8b\\",\\"variantId\\":133,\\"productId\\":94,\\"name\\":\\"Gratis - Standard\\",\\"price\\":0.1,\\"quantity\\":2}]"	0.2	0	0	0.2	Cash	66	Admin User	64	Cassa	2026-01-31 22:17:09.295	0	\N	completed
110	"[{\\"id\\":\\"c8488518-1bc2-4448-8f78-d88e06af6062\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":2},{\\"id\\":\\"4e7fdd19-0ec8-44dc-a5a5-6b79091e3995\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	30	0	0	30	Cash	66	Admin User	64	Cassa	2026-01-31 22:17:19.074	0	\N	completed
111	"[{\\"id\\":\\"fdcacbd8-ccd4-4cc6-9386-1672e19d8353\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	10	0	0	10	Cash	66	Admin User	64	Cassa	2026-01-31 22:20:02.678	0	\N	completed
112	"[{\\"id\\":\\"c6b68a64-409f-4cf2-98a7-991e8d36eef1\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1},{\\"id\\":\\"6cbf5300-955f-4706-8d30-a54cb4479401\\",\\"variantId\\":141,\\"productId\\":99,\\"name\\":\\"VT - Standard\\",\\"price\\":5,\\"quantity\\":1}]"	7	0	0	7	Cash	67	Bar	65	Bar	2026-01-31 22:21:49.367	0	\N	completed
113	"[{\\"id\\":\\"f6460fec-95dc-47b4-81bd-86a352413149\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":2}]"	20	0	0	20	Cash	66	Admin User	64	Cassa	2026-01-31 22:32:19.813	0	\N	completed
114	"[{\\"id\\":\\"361df239-826a-4721-8e1b-b2d4f82e2b58\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"79f18056-b0a3-4ba3-9942-24ffb937c97c\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":2}]"	30	0	0	30	Cash	66	Admin User	64	Cassa	2026-01-31 22:47:08.276	0	\N	completed
115	"[{\\"id\\":\\"8b3df07c-96ac-4f6b-9512-7d5e6326b9a5\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1},{\\"id\\":\\"726662a8-1b1d-40ec-bad8-8981933255e2\\",\\"variantId\\":128,\\"productId\\":84,\\"name\\":\\"Vino Bianco - Glass (150ml)\\",\\"price\\":5,\\"quantity\\":1}]"	7	0	0	7	Cash	67	Bar	65	Bar	2026-01-31 22:56:07.42	0	\N	completed
116	"[{\\"id\\":\\"c50da524-e673-4c51-9290-036cea3f1d80\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1}]"	2	0	0	2	Cash	67	Bar	65	Bar	2026-01-31 23:07:29.363	0	\N	completed
117	"[{\\"id\\":\\"7b3f456e-81d8-45b4-9807-ccaa1de03ac1\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":2},{\\"id\\":\\"9c745e05-9e48-44f1-b673-c00c5b7fb4b9\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":2}]"	40	0	0	40	Cash	66	Admin User	64	Cassa	2026-01-31 23:10:06.652	0	\N	completed
118	"[{\\"id\\":\\"564b0090-b375-4fd5-8a03-2298dcdd1c9e\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":2}]"	20	0	0	20	Cash	66	Admin User	64	Cassa	2026-01-31 23:10:15.934	0	\N	completed
119	"[{\\"id\\":\\"47e185ab-ea43-4c86-8ca4-60ee3c368ecc\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":2}]"	20	0	0	20	Cash	66	Admin User	64	Cassa	2026-01-31 23:15:35.861	0	\N	completed
120	"[{\\"id\\":\\"7b81ad16-fb7d-4ab8-84d9-66011c3802fd\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1}]"	5	0	0	5	Cash	67	Bar	65	Bar	2026-01-31 23:17:16.543	0	\N	completed
121	"[{\\"id\\":\\"516743b3-1485-49c8-a6fd-911a338f4068\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1}]"	5	0	0	5	Cash	67	Bar	65	Bar	2026-01-31 23:17:31.372	0	\N	completed
122	"[{\\"id\\":\\"21a11d02-3102-4fa2-b3e1-4a6897ce56ac\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"5af2eb90-f41c-44fb-bf22-45eec1b3159d\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	20	0	0	20	Cash	66	Admin User	64	Cassa	2026-01-31 23:20:09.61	0	\N	completed
123	"[{\\"id\\":\\"c2b27e47-5d9a-47fb-b3c8-2ee6842e79d9\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	8	0	0	8	Cash	67	Bar	65	Bar	2026-01-31 23:20:33.715	0	\N	completed
124	"[{\\"id\\":\\"166940cc-a225-4724-ab8d-a789b05e64d3\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":2}]"	16	0	0	16	Cash	67	Bar	65	Bar	2026-01-31 23:25:28.149	0	\N	completed
125	"[{\\"id\\":\\"5056b1d7-1b75-431b-80ee-c2daa33dc895\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1}]"	5	0	0	5	Cash	67	Bar	65	Bar	2026-01-31 23:25:39.37	0	\N	completed
126	"[{\\"id\\":\\"8c5f5e9f-27cf-4036-ad84-6d75dd2b502b\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1}]"	2	0	0	2	Cash	67	Bar	65	Bar	2026-01-31 23:25:54.511	0	\N	completed
127	"[{\\"id\\":\\"b7c47d11-2e71-40ef-9fc1-703c1c842848\\",\\"variantId\\":137,\\"productId\\":97,\\"name\\":\\"Sipsmith Tonica - Standard\\",\\"price\\":12,\\"quantity\\":1}]"	12	0	0	12	Cash	67	Bar	65	Bar	2026-01-31 23:32:58.407	0	\N	completed
128	"[{\\"id\\":\\"4c267836-761f-406a-9c3b-ad4ca4cb296b\\",\\"variantId\\":134,\\"productId\\":95,\\"name\\":\\"Vodka Shot - Standard\\",\\"price\\":3,\\"quantity\\":3}]"	9	0	0	9	Cash	67	Bar	65	Bar	2026-01-31 23:33:43.839	0	\N	completed
129	"[{\\"id\\":\\"0d592c80-40af-4b26-9110-2345412429fd\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"57e3711f-9f02-4b04-8f9e-e61f4f48d2f2\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	20	0	0	20	Cash	66	Admin User	64	Cassa	2026-01-31 23:37:22.8	0	\N	completed
130	"[{\\"id\\":\\"3a4c6ee6-98d3-4ac4-b948-c4ae2df09f24\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1}]"	5	0	0	5	Cash	67	Bar	65	Bar	2026-01-31 23:45:19.835	0	\N	completed
131	"[{\\"id\\":\\"3a4c6ee6-98d3-4ac4-b948-c4ae2df09f24\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1}]"	5	0	0	5	Cash	67	Bar	65	Bar	2026-01-31 23:45:19.888	0	\N	completed
132	"[{\\"id\\":\\"796361f6-c916-448d-a7fb-0a7f55323c97\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":2},{\\"id\\":\\"69f339cc-132f-4931-8e31-54afdf942910\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":2}]"	40	0	0	40	Cash	66	Admin User	64	Cassa	2026-01-31 23:50:14.043	0	\N	completed
133	"[{\\"id\\":\\"912cabd7-9e0e-4151-b14b-9518f216e769\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	8	0	0	8	Cash	67	Bar	65	Bar	2026-01-31 23:52:54.158	0	\N	completed
134	"[{\\"id\\":\\"ae23e389-f213-4bdc-8ca2-aa52f22d60d9\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	8	0	0	8	Cash	67	Bar	65	Bar	2026-01-31 23:55:37.234	0	\N	completed
135	"[{\\"id\\":\\"ac0f0074-f35a-4df0-9726-b866153b82b6\\",\\"variantId\\":119,\\"productId\\":89,\\"name\\":\\"Vodka Lemon - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	8	0	0	8	Cash	67	Bar	65	Bar	2026-02-01 00:04:17.341	0	\N	completed
136	"[{\\"id\\":\\"34fa98e5-9b49-4aaa-88dd-553fe5aa8145\\",\\"variantId\\":116,\\"productId\\":88,\\"name\\":\\"Lemonsoda - Standard\\",\\"price\\":3,\\"quantity\\":1}]"	3	0	0	3	Cash	67	Bar	65	Bar	2026-02-01 00:04:43.274	0	\N	completed
137	"[{\\"id\\":\\"aa3cc004-7afe-4313-85b4-93626ea72ce6\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1}]"	5	0	0	5	Cash	67	Bar	65	Bar	2026-02-01 00:06:15.005	0	\N	completed
138	"[{\\"id\\":\\"8ccd5206-69d0-4e9b-b8f8-5712daca7ed9\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1}]"	8	0	0	8	Cash	67	Bar	65	Bar	2026-02-01 00:10:50.432	0	\N	completed
139	"[{\\"id\\":\\"22820d3f-f308-4520-be84-f9b22252e248\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":2},{\\"id\\":\\"670e1ecd-7ab1-4f0f-8e19-5db7f99a8aaf\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1}]"	21	0	0	21	Cash	67	Bar	65	Bar	2026-02-01 00:14:15.503	0	\N	completed
140	"[{\\"id\\":\\"3eedff8d-e250-41d2-adb2-e4b0be71faf7\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1}]"	2	0	0	2	Cash	67	Bar	65	Bar	2026-02-01 00:31:33.046	0	\N	completed
141	"[{\\"id\\":\\"35da3df7-3bc3-4161-9793-c5ad369369ea\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":3}]"	24	0	0	24	Cash	67	Bar	65	Bar	2026-02-01 00:32:44.959	0	\N	completed
142	"[{\\"id\\":\\"0d52871a-5329-4acf-a54c-d9a2c6f1a25c\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1}]"	5	0	0	5	Cash	67	Bar	65	Bar	2026-02-01 00:38:39.441	0	\N	completed
143	"[{\\"id\\":\\"7e1ffdad-32d1-46b4-a0d7-5c41b3bc0e88\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1},{\\"id\\":\\"a50ada1b-1f97-4f50-af73-c0879a416dbb\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1}]"	7	0	0	7	Cash	67	Bar	65	Bar	2026-02-01 00:59:56.954	0	\N	completed
144	"[{\\"id\\":\\"95203692-d843-460e-9a6b-63a728984830\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1}]"	2	0	0	2	Cash	67	Bar	65	Bar	2026-02-01 01:05:30.049	0	\N	completed
145	"[{\\"id\\":\\"6fe88499-9690-4600-a23d-c2875104073d\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1}]"	10	0	0	10	Cash	66	Admin User	64	Cassa	2026-02-01 01:54:40.384	0	\N	completed
146	"[{\\"id\\":\\"92923f63-05fd-49b5-b271-c8627933acc5\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":3}]"	30	0	0	30	Cash	66	Admin User	64	Cassa	2026-02-01 02:17:21.634	0	\N	completed
147	"[{\\"id\\":\\"85440655-f492-4a59-ae2f-898aa2349b28\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1},{\\"id\\":\\"13669d5f-0f20-4299-8cb7-f28dff22fa8b\\",\\"variantId\\":133,\\"productId\\":94,\\"name\\":\\"Gratis - Standard\\",\\"price\\":0.1,\\"quantity\\":2}]"	10.2	0	0	10.2	Cash	66	Admin User	64	Cassa	2026-02-01 02:21:33.973	0	\N	completed
148	"[{\\"id\\":\\"a6f984fa-96e2-424f-a32d-db4961d93af5\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	10	1.9	0	11.9	Cash	66	Admin User	64	Cassa	2026-02-10 20:33:59.2	0	\N	completed
150	"[{\\"id\\":\\"9633c5ef-6e57-496c-b638-dee882509514\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":4,\\"effectiveTaxRate\\":0},{\\"id\\":\\"fb5fe2bc-23b7-474e-b22c-f9183650c2b8\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":4,\\"effectiveTaxRate\\":0},{\\"id\\":\\"1aa4dc55-d14d-4fdd-aa52-6b4e0f9022f2\\",\\"variantId\\":134,\\"productId\\":95,\\"name\\":\\"Vodka Shot - Standard\\",\\"price\\":3,\\"quantity\\":8,\\"effectiveTaxRate\\":0},{\\"id\\":\\"7b917ed1-ab08-4cfb-b9cd-2fcc8488e702\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":2,\\"effectiveTaxRate\\":0},{\\"id\\":\\"49130a04-2d91-488d-b3b8-d6205c761f5f\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":2,\\"effectiveTaxRate\\":0}]"	96	0	0	96	Cash	66	Admin User	65	Bar	2026-02-10 22:02:51.769	0	\N	completed
189	"[{\\"id\\":\\"01971c01-afa6-49a0-b463-f8a6bc56fd28\\",\\"variantId\\":164,\\"productId\\":94,\\"name\\":\\"Gratis - Standard\\",\\"price\\":0,\\"quantity\\":4,\\"effectiveTaxRate\\":0.19}]"	0	0	0	0	Cash	65	Cassa	64	Cassa	2026-02-15 19:44:21.591	0	\N	completed
164	"[{\\"id\\":\\"e0e56f49-2991-4cf9-9ab0-2db973029c39\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"06beba17-95aa-4641-86af-8924b705be6e\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	20	0	0	20	Cash	65	Cassa	64	Cassa	2026-02-15 17:12:54.626	0	\N	completed
166	"[{\\"id\\":\\"6e238ce3-511a-4c7a-a8d8-b19a8bce47b1\\",\\"variantId\\":164,\\"productId\\":94,\\"name\\":\\"Gratis - Standard\\",\\"price\\":0,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	0	0	0	0	Cash	65	Cassa	64	Cassa	2026-02-15 17:29:51.984	0	\N	completed
167	"[{\\"id\\":\\"2f48c958-344f-414e-ad46-e47bc490216f\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	10	0	0	10	Cash	65	Cassa	64	Cassa	2026-02-15 17:40:37.044	0	\N	completed
168	"[{\\"id\\":\\"675cce8d-166b-4fdd-bb35-0299555fa192\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"d9b2a259-03b5-4fd9-a6a9-bc15dc216e21\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	40	0	0	40	Cash	65	Cassa	64	Cassa	2026-02-15 17:43:22.056	0	\N	completed
170	"[{\\"id\\":\\"19e0fd70-d218-4db8-bb97-4e8839aa9fc5\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"e915e00a-e427-4ce6-ba95-944d0ac2073a\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	20	0	0	20	Cash	65	Cassa	64	Cassa	2026-02-15 17:55:09.073	0	\N	completed
171	"[{\\"id\\":\\"824435b3-96f8-483d-a69e-da96e5a5f225\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"98b7afd8-4a4e-4941-82d8-5d64cc5c10fa\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	20	0	0	20	Cash	65	Cassa	64	Cassa	2026-02-15 17:58:45.421	0	\N	completed
172	"[{\\"id\\":\\"dd32bd76-549a-47fa-a998-7b56afca325b\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	10	0	0	10	Cash	65	Cassa	64	Cassa	2026-02-15 17:59:41.782	0	\N	completed
173	"[{\\"id\\":\\"6a05c4c8-08b8-4c9f-8a70-cbce1277de5f\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	10	0	0	10	Cash	65	Cassa	64	Cassa	2026-02-15 18:00:11.426	0	\N	completed
175	"[{\\"id\\":\\"25511676-8bb0-439c-84ab-9dcc38fecb14\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	20	0	0	20	Cash	65	Cassa	64	Cassa	2026-02-15 18:02:49.589	0	\N	completed
176	"[{\\"id\\":\\"a1cd4ea0-0645-4e7f-b666-28df5f34ff36\\",\\"variantId\\":127,\\"productId\\":86,\\"name\\":\\"Pirlo Campari - Standard\\",\\"price\\":5,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	5	0	0	5	Cash	66	Admin User	65	Bar	2026-02-15 18:07:29.688	0	\N	completed
177	"[{\\"id\\":\\"17c919ce-1db1-4151-9a54-5bbfcae43d11\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"88b4a86c-b6a6-4e61-bc59-f1ac877e4ac4\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	30	0	0	30	Cash	65	Cassa	64	Cassa	2026-02-15 18:17:27.921	0	\N	completed
180	"[{\\"id\\":\\"23f71b7d-6135-4891-8e0f-0a7bb0ab45cc\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"904a60d5-ad17-412c-9f29-fbda06cf389d\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	40	0	0	40	Cash	65	Cassa	64	Cassa	2026-02-15 18:30:15.137	0	\N	completed
181	"[{\\"id\\":\\"9e3bf4d6-4501-4f05-bc63-959c58431de6\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	10	0	0	10	Cash	65	Cassa	64	Cassa	2026-02-15 18:32:19.729	0	\N	completed
183	"[{\\"id\\":\\"989ff965-1df6-4b76-9a34-fc32617fc7a1\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	10	0	0	10	Cash	65	Cassa	64	Cassa	2026-02-15 19:15:57.401	0	\N	completed
184	"[{\\"id\\":\\"03cd22e7-aec1-439d-9f93-f0a7919dc007\\",\\"variantId\\":164,\\"productId\\":94,\\"name\\":\\"Gratis - Standard\\",\\"price\\":0,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	0	0	0	0	Cash	65	Cassa	64	Cassa	2026-02-15 19:20:47.967	0	\N	completed
185	"[{\\"id\\":\\"5ba684e3-748e-413c-891c-e178792233db\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"3973117b-0c06-4e9e-878e-59994e4fc678\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	20	0	0	20	Cash	65	Cassa	64	Cassa	2026-02-15 19:25:17.229	0	\N	completed
186	"[{\\"id\\":\\"bc0105a3-7601-4792-8f80-8e315c622416\\",\\"variantId\\":168,\\"productId\\":95,\\"name\\":\\"Vodka Shot - Standard\\",\\"price\\":3,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	3	0	0	3	Cash	66	Admin User	65	Bar	2026-02-15 19:26:29	0	\N	completed
187	"[{\\"id\\":\\"2aac2ab7-2c1b-4a02-a719-67af8c26417b\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	2	0	0	2	Cash	66	Admin User	65	Bar	2026-02-15 19:26:36.947	0	\N	completed
188	"[{\\"id\\":\\"98ae0d77-b303-4bac-806d-30066231121c\\",\\"variantId\\":127,\\"productId\\":86,\\"name\\":\\"Pirlo Campari - Standard\\",\\"price\\":5,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	5	0	0	5	Cash	66	Admin User	65	Bar	2026-02-15 19:41:21.066	0	\N	completed
190	"[{\\"id\\":\\"a66bd7b1-da32-4fad-a25e-afaa63c74ce4\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	10	0	0	10	Cash	65	Cassa	64	Cassa	2026-02-15 19:50:02.921	0	\N	completed
191	"[{\\"id\\":\\"4d59e4b2-9c94-493d-be0e-2f42303d4fe6\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	8	0	0	8	Cash	66	Admin User	65	Bar	2026-02-15 19:55:04.94	0	\N	completed
192	"[{\\"id\\":\\"4c7fe372-a6b9-4856-b304-0993270cae20\\",\\"variantId\\":149,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":6,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	12	0	0	12	Cash	66	Admin User	65	Bar	2026-02-15 19:55:13.979	0	\N	completed
193	"[{\\"id\\":\\"8780d58c-b8e4-43d6-ae0d-4e0538b8372a\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	2	0	0	2	Cash	66	Admin User	65	Bar	2026-02-15 19:55:22.576	0	\N	completed
194	"[{\\"id\\":\\"4e9ac9cd-cbe3-4db4-b287-6fd71e9adb3b\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"355c7efb-a134-4abf-b73c-54aeb9cbf853\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	40	0	0	40	Cash	65	Cassa	64	Cassa	2026-02-15 20:01:30.392	0	\N	completed
195	"[{\\"id\\":\\"bfacb8b2-430e-4acd-a64b-9cf441842dc0\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"83c29867-6429-48d9-bf70-de6db6bf40ff\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	40	0	0	40	Cash	65	Cassa	64	Cassa	2026-02-15 20:04:01.807	0	\N	completed
196	"[{\\"id\\":\\"32d7ae59-ff87-403a-981a-0ba6510e5206\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	20	0	0	20	Cash	65	Cassa	64	Cassa	2026-02-15 20:05:01.83	0	\N	completed
197	"[{\\"id\\":\\"16f1a311-f059-48b6-99c6-0de21d6d0f60\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	10	0	0	10	Cash	65	Cassa	64	Cassa	2026-02-15 20:05:45.11	0	\N	completed
198	"[{\\"id\\":\\"ab9e1232-a0fc-4dc2-8c08-f2ccf81cc589\\",\\"variantId\\":150,\\"productId\\":93,\\"name\\":\\"Gin Lemon - Standard\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"4aa08263-9d77-4dda-b2b4-8775ea88453c\\",\\"variantId\\":151,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"0b4162c7-3501-4fa7-8218-453ef6569792\\",\\"variantId\\":137,\\"productId\\":97,\\"name\\":\\"Sipsmith Tonica - Standard\\",\\"price\\":12,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	28	0	0	28	Cash	66	Admin User	65	Bar	2026-02-15 20:07:25.285	0	\N	completed
199	"[{\\"id\\":\\"e1551999-e3bc-4177-b8e0-6c5eb476869b\\",\\"variantId\\":167,\\"productId\\":101,\\"name\\":\\"Ginger Beer - Standard\\",\\"price\\":3,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	3	0	0	3	Cash	66	Admin User	65	Bar	2026-02-15 20:07:42.909	0	\N	completed
200	"[{\\"id\\":\\"60187228-f1cc-471d-8bc2-9c497df87279\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"3081f913-fbed-4164-bd17-404d5298e257\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	20	0	0	20	Cash	65	Cassa	64	Cassa	2026-02-15 20:07:48.812	0	\N	completed
201	"[{\\"id\\":\\"7f50fd23-50cc-42bc-af2b-ce763386196b\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	2	0	0	2	Cash	66	Admin User	65	Bar	2026-02-15 20:08:10.074	0	\N	completed
202	"[{\\"id\\":\\"5d014f88-eb76-4f44-8e20-29a16b6d7437\\",\\"variantId\\":148,\\"productId\\":102,\\"name\\":\\"Birra Beck's - Standard\\",\\"price\\":4,\\"quantity\\":3,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"7722cf2c-d70a-4760-b95a-813199098ee7\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	20	0	0	20	Cash	66	Admin User	65	Bar	2026-02-15 20:19:32.845	0	\N	completed
203	"[{\\"id\\":\\"91898f9c-87c0-4ed7-bea3-b0df2816efe3\\",\\"variantId\\":164,\\"productId\\":94,\\"name\\":\\"Gratis - Standard\\",\\"price\\":0,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	0	0	0	0	Cash	65	Cassa	64	Cassa	2026-02-15 20:26:13.267	0	\N	completed
204	"[{\\"id\\":\\"bea1afff-f3a7-4614-8e04-4670d488e216\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	10	0	0	10	Cash	65	Cassa	64	Cassa	2026-02-15 20:28:25.278	0	\N	completed
205	"[{\\"id\\":\\"af217518-e0ab-4655-ab58-ee833c9c00fc\\",\\"variantId\\":127,\\"productId\\":86,\\"name\\":\\"Pirlo Campari - Standard\\",\\"price\\":5,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	5	0	0	5	Cash	66	Admin User	65	Bar	2026-02-15 20:28:32.022	0	\N	completed
206	"[{\\"id\\":\\"6dfad584-8242-4533-9d60-b56f5a132454\\",\\"variantId\\":151,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	16	0	0	16	Cash	66	Admin User	65	Bar	2026-02-15 20:32:48.544	0	\N	completed
207	"[{\\"id\\":\\"7ca9612e-4455-430d-963e-69f12fa0e510\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	10	0	0	10	Cash	66	Admin User	64	Cassa	2026-02-15 20:51:14.598	0	\N	completed
208	"[{\\"id\\":\\"1cb6e576-a943-40de-b863-f4c64d56346b\\",\\"variantId\\":169,\\"productId\\":96,\\"name\\":\\"Hierbas Shot - Standard\\",\\"price\\":3,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	6	0	0	6	Cash	66	Admin User	65	Bar	2026-02-15 20:55:59.059	0	\N	completed
209	"[{\\"id\\":\\"108ffdfc-0f51-4354-8439-b4948b4bf515\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"8fa4b20d-321a-4012-8a88-c64b436d43d3\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	20	0	0	20	Cash	66	Admin User	64	Cassa	2026-02-15 20:57:26.033	0	\N	completed
210	"[{\\"id\\":\\"713109eb-abce-449d-8042-6e128397bc25\\",\\"variantId\\":151,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"f8dfd470-ddfc-4e92-819e-968f4795d16f\\",\\"variantId\\":137,\\"productId\\":97,\\"name\\":\\"Sipsmith Tonica - Standard\\",\\"price\\":12,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	20	0	0	20	Cash	66	Admin User	65	Bar	2026-02-15 21:02:12.895	0	\N	completed
211	"[{\\"id\\":\\"3d23a39a-2223-4a6e-8291-25017bfd81e7\\",\\"variantId\\":149,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":6,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"52b72d75-6abb-453c-820e-26408fa2105a\\",\\"variantId\\":148,\\"productId\\":102,\\"name\\":\\"Birra Beck's - Standard\\",\\"price\\":4,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	16	0	0	16	Cash	66	Admin User	65	Bar	2026-02-15 21:02:40.436	0	\N	completed
212	"[{\\"id\\":\\"764880b4-fd35-4898-b251-02be1af9d30e\\",\\"variantId\\":164,\\"productId\\":94,\\"name\\":\\"Gratis - Standard\\",\\"price\\":0,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	0	0	0	0	Cash	66	Admin User	64	Cassa	2026-02-15 21:06:50.079	0	\N	completed
213	"[{\\"id\\":\\"aefdf8ba-4287-4ff2-98e6-685a86a41e24\\",\\"variantId\\":148,\\"productId\\":102,\\"name\\":\\"Birra Beck's - Standard\\",\\"price\\":4,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	4	0	0	4	Cash	66	Admin User	65	Bar	2026-02-15 21:08:36.617	0	\N	completed
214	"[{\\"id\\":\\"25a0a7d3-b6e6-4ffc-844b-574645288041\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	2	0	0	2	Cash	66	Admin User	65	Bar	2026-02-15 21:08:46.53	0	\N	completed
215	"[{\\"id\\":\\"5bcf8aaa-0a2a-411b-a7f6-ca2e93a5ddd5\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"28860d59-98b5-4c2a-bc0e-cdcc0154a4cd\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	20	0	0	20	Cash	66	Admin User	64	Cassa	2026-02-15 21:15:03.959	0	\N	completed
216	"[{\\"id\\":\\"eb5fa9e3-53d7-4454-a7df-6c7e430aa843\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"49c13919-e77d-4d4a-a4cf-fd82fa664d95\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	20	0	0	20	Cash	66	Admin User	64	Cassa	2026-02-15 21:15:55.289	0	\N	completed
217	"[{\\"id\\":\\"e209995b-1fb1-4736-82f4-6128bdb0d44b\\",\\"variantId\\":119,\\"productId\\":89,\\"name\\":\\"Vodka Lemon - Standard\\",\\"price\\":8,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	16	0	0	16	Cash	66	Admin User	65	Bar	2026-02-15 21:16:26.024	0	\N	completed
218	"[{\\"id\\":\\"db8b90f7-08ee-48e6-a0f9-47ffa85f4581\\",\\"variantId\\":151,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	8	0	0	8	Cash	66	Admin User	65	Bar	2026-02-15 21:16:50.53	0	\N	completed
219	"[{\\"id\\":\\"db8b90f7-08ee-48e6-a0f9-47ffa85f4581\\",\\"variantId\\":151,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	8	0	0	8	Cash	66	Admin User	65	Bar	2026-02-15 21:16:50.551	0	\N	completed
220	"[{\\"id\\":\\"19a8f8ab-2d4f-425c-afba-ce698f29abd7\\",\\"variantId\\":169,\\"productId\\":96,\\"name\\":\\"Hierbas Shot - Standard\\",\\"price\\":3,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	6	0	0	6	Cash	66	Admin User	65	Bar	2026-02-15 21:17:03.801	0	\N	completed
221	"[{\\"id\\":\\"caa22608-b65b-4b55-9347-6e63cc8f6a7d\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"7ced67c8-936a-46c4-bd9e-89fb3cf50642\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	20	0	0	20	Cash	66	Admin User	64	Cassa	2026-02-15 21:20:37.443	0	\N	completed
222	"[{\\"id\\":\\"1af6a8f4-3385-420a-8f37-8215e4a369da\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	10	0	0	10	Cash	66	Admin User	64	Cassa	2026-02-15 21:21:21.301	0	\N	completed
224	"[{\\"id\\":\\"55ef0f88-b2af-47b4-a977-28f28c928030\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	20	0	0	20	Cash	66	Admin User	64	Cassa	2026-02-15 21:22:30.538	0	\N	completed
225	"[{\\"id\\":\\"e9a58520-e02a-4c3d-9257-103578da2ef2\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	10	0	0	10	Cash	66	Admin User	64	Cassa	2026-02-15 21:23:01.607	0	\N	completed
227	"[{\\"id\\":\\"4e7b919b-1b17-4428-98dc-cc223a0304d0\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	10	0	0	10	Cash	66	Admin User	64	Cassa	2026-02-15 21:26:14.302	0	\N	completed
228	"[{\\"id\\":\\"16df382c-fb04-4194-8fa1-d0a3fab38063\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"c040b0a7-3445-4cf5-afc2-c518ace156b1\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	20	0	0	20	Cash	66	Admin User	64	Cassa	2026-02-15 21:27:55.944	0	\N	completed
229	"[{\\"id\\":\\"e53c2f97-9d25-4230-ad3f-082a0e071578\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"7e94bb5f-aeae-4087-ae95-7b9d6265f938\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	20	0	0	20	Cash	66	Admin User	64	Cassa	2026-02-15 21:29:58.255	0	\N	completed
230	"[{\\"id\\":\\"4d2222a6-1d43-4cca-b77d-58c51d650338\\",\\"variantId\\":169,\\"productId\\":96,\\"name\\":\\"Hierbas Shot - Standard\\",\\"price\\":3,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	6	0	0	6	Cash	67	Bar	65	Bar	2026-02-15 21:32:03.088	0	\N	completed
231	"[{\\"id\\":\\"890b1160-7257-4c5a-b7f9-6767e3f7caf1\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	10	0	0	10	Cash	66	Admin User	64	Cassa	2026-02-15 21:41:09.52	0	\N	completed
232	"[{\\"id\\":\\"85e1cf0e-cdc3-40a6-a236-c858ce376869\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	10	0	0	10	Cash	66	Admin User	64	Cassa	2026-02-15 21:42:21.169	0	\N	completed
233	"[{\\"id\\":\\"e02d1d8d-de9f-4625-b88a-21bf5c30cfdf\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	2	0	0	2	Cash	67	Bar	65	Bar	2026-02-15 21:42:48.26	0	\N	completed
234	"[{\\"id\\":\\"ea91a657-3c11-462d-b92b-437e5437079e\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"3302aaea-7cba-4b28-a302-766fcd4fc43e\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	20	0	0	20	Cash	66	Admin User	64	Cassa	2026-02-15 21:45:15.954	0	\N	completed
235	"[{\\"id\\":\\"97ee4dd7-f7e9-4660-9ed5-8a84d6d59bb2\\",\\"variantId\\":124,\\"productId\\":90,\\"name\\":\\"Tessera - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	10	0	0	10	Cash	66	Admin User	64	Cassa	2026-02-15 21:46:14.61	0	\N	completed
236	"[{\\"id\\":\\"3bbd9cd9-3d7c-4092-9727-25eabf61a088\\",\\"variantId\\":159,\\"productId\\":109,\\"name\\":\\"Becks FF - Standard\\",\\"price\\":3,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	6	0	0	6	Cash	67	Bar	65	Bar	2026-02-15 21:48:25.841	0	\N	completed
237	"[{\\"id\\":\\"6ff507f8-6f1c-4ccd-8877-234d19f1395f\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	10	0	0	10	Cash	66	Admin User	64	Cassa	2026-02-15 21:48:28.343	0	\N	completed
238	"[{\\"id\\":\\"cdb807bb-9f52-41d6-a073-8bee8d241241\\",\\"variantId\\":148,\\"productId\\":102,\\"name\\":\\"Birra Beck's - Standard\\",\\"price\\":4,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	4	0	0	4	Cash	67	Bar	65	Bar	2026-02-15 21:48:38.838	0	\N	completed
239	"[{\\"id\\":\\"d4e55ca4-fb46-4979-8984-33d577eaed1b\\",\\"variantId\\":126,\\"productId\\":91,\\"name\\":\\"Biglietto - Standard\\",\\"price\\":10,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	10	0	0	10	Cash	66	Admin User	64	Cassa	2026-02-15 21:50:28.699	0	\N	completed
240	"[{\\"id\\":\\"4db2674b-0f0d-46de-948e-6b07a490b025\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	2	0	0	2	Cash	67	Bar	65	Bar	2026-02-15 21:50:50.898	0	\N	completed
241	"[{\\"id\\":\\"d8d90f9c-ae80-4199-9b40-e90514e474f4\\",\\"variantId\\":169,\\"productId\\":96,\\"name\\":\\"Hierbas Shot - Standard\\",\\"price\\":3,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	6	0	0	6	Cash	67	Bar	65	Bar	2026-02-15 21:54:38.401	0	\N	completed
242	"[{\\"id\\":\\"360483c2-4166-407e-8226-fb93d2b558a7\\",\\"variantId\\":151,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	8	0	0	8	Cash	67	Bar	65	Bar	2026-02-15 21:59:09.008	0	\N	completed
243	"[{\\"id\\":\\"a1a6a95e-966e-47c9-899d-76618197cf09\\",\\"variantId\\":148,\\"productId\\":102,\\"name\\":\\"Birra Beck's - Standard\\",\\"price\\":4,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	8	0	0	8	Cash	67	Bar	65	Bar	2026-02-15 21:59:20.679	0	\N	completed
245	"[{\\"id\\":\\"e3ee8ebd-7f1e-4443-9f25-18ddb9fea9c5\\",\\"variantId\\":119,\\"productId\\":89,\\"name\\":\\"Vodka Lemon - Standard\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	8	0	0	8	Cash	67	Bar	65	Bar	2026-02-15 22:18:43.532	0	\N	completed
246	"[{\\"id\\":\\"69f51c00-8501-4a3c-8708-31e8c5722b67\\",\\"variantId\\":151,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	8	0	0	8	Cash	67	Bar	65	Bar	2026-02-15 22:26:45.313	0	\N	completed
247	"[{\\"id\\":\\"5a3f4593-33c2-4d99-ada6-c1b5e6fbb6cc\\",\\"variantId\\":169,\\"productId\\":96,\\"name\\":\\"Hierbas Shot - Standard\\",\\"price\\":3,\\"quantity\\":3,\\"effectiveTaxRate\\":0.19}]"	9	0	0	9	Cash	67	Bar	65	Bar	2026-02-15 22:34:09.89	0	\N	completed
248	"[{\\"id\\":\\"91965b36-cce2-43ef-bde1-0a66748d795c\\",\\"variantId\\":163,\\"productId\\":104,\\"name\\":\\"VL - Standard\\",\\"price\\":5,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	5	0	0	5	Cash	67	Bar	65	Bar	2026-02-15 22:36:43.945	0	\N	completed
66	"[{\\"id\\":\\"0e573fef-2753-4c6e-bcea-36233a1ae3f3\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":1,\\"effectiveTaxRate\\":0},{\\"id\\":\\"a767da50-9345-4ec0-bb9b-ae1557137f2f\\",\\"variantId\\":134,\\"productId\\":95,\\"name\\":\\"Vodka Shot - Standard\\",\\"price\\":3,\\"quantity\\":1,\\"effectiveTaxRate\\":0},{\\"id\\":\\"e469ecab-f2d5-4b20-9c71-bea21c9fe48f\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":3,\\"effectiveTaxRate\\":0},{\\"id\\":\\"8488229a-d056-40a4-a8c9-4ae7e9cb12a0\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0},{\\"id\\":\\"37e32447-b2c4-4a9b-ad02-51d6f6a42cd3\\",\\"variantId\\":137,\\"productId\\":97,\\"name\\":\\"Sipsmith Tonica - Standard\\",\\"price\\":12,\\"quantity\\":2,\\"effectiveTaxRate\\":0}]"	46	0	0	46	Card	65	Cassa	64	Cassa	2026-01-23 16:58:57.718	0	\N	completed
149	"[{\\"id\\":\\"9633c5ef-6e57-496c-b638-dee882509514\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":4,\\"effectiveTaxRate\\":0},{\\"id\\":\\"fb5fe2bc-23b7-474e-b22c-f9183650c2b8\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":4,\\"effectiveTaxRate\\":0},{\\"id\\":\\"1aa4dc55-d14d-4fdd-aa52-6b4e0f9022f2\\",\\"variantId\\":134,\\"productId\\":95,\\"name\\":\\"Vodka Shot - Standard\\",\\"price\\":3,\\"quantity\\":8,\\"effectiveTaxRate\\":0},{\\"id\\":\\"7b917ed1-ab08-4cfb-b9cd-2fcc8488e702\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":2,\\"effectiveTaxRate\\":0},{\\"id\\":\\"49130a04-2d91-488d-b3b8-d6205c761f5f\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":2,\\"effectiveTaxRate\\":0}]"	96	0	0	96	Card	66	Admin User	65	Bar	2026-02-10 22:02:47.857	0	\N	completed
151	"[{\\"id\\":\\"9633c5ef-6e57-496c-b638-dee882509514\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":4,\\"effectiveTaxRate\\":0},{\\"id\\":\\"fb5fe2bc-23b7-474e-b22c-f9183650c2b8\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":4,\\"effectiveTaxRate\\":0},{\\"id\\":\\"1aa4dc55-d14d-4fdd-aa52-6b4e0f9022f2\\",\\"variantId\\":134,\\"productId\\":95,\\"name\\":\\"Vodka Shot - Standard\\",\\"price\\":3,\\"quantity\\":8,\\"effectiveTaxRate\\":0},{\\"id\\":\\"7b917ed1-ab08-4cfb-b9cd-2fcc8488e702\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":2,\\"effectiveTaxRate\\":0},{\\"id\\":\\"49130a04-2d91-488d-b3b8-d6205c761f5f\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":2,\\"effectiveTaxRate\\":0}]"	96	0	0	96	Card	66	Admin User	65	Bar	2026-02-10 22:05:19.865	0	\N	completed
152	"[{\\"id\\":\\"43a9f205-863d-47b3-a056-a572d0fbf47c\\",\\"variantId\\":127,\\"productId\\":86,\\"name\\":\\"Pirlo Campari - Standard\\",\\"price\\":5,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	5	0	0	5	Card	66	Admin User	65	Bar	2026-02-10 22:07:15.871	0	\N	completed
153	"[{\\"id\\":\\"43a9f205-863d-47b3-a056-a572d0fbf47c\\",\\"variantId\\":127,\\"productId\\":86,\\"name\\":\\"Pirlo Campari - Standard\\",\\"price\\":5,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	5	0	0	5	Card	66	Admin User	65	Bar	2026-02-11 08:15:03.111	0	\N	completed
154	"[{\\"id\\":\\"43a9f205-863d-47b3-a056-a572d0fbf47c\\",\\"variantId\\":127,\\"productId\\":86,\\"name\\":\\"Pirlo Campari - Standard\\",\\"price\\":5,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	5	0	0	5	Card	66	Admin User	65	Bar	2026-02-11 08:15:11.314	0	\N	completed
155	"[{\\"id\\":\\"43a9f205-863d-47b3-a056-a572d0fbf47c\\",\\"variantId\\":127,\\"productId\\":86,\\"name\\":\\"Pirlo Campari - Standard\\",\\"price\\":5,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	5	0	0	5	Card	66	Admin User	65	Bar	2026-02-11 08:15:47.568	0	\N	completed
156	"[{\\"id\\":\\"43a9f205-863d-47b3-a056-a572d0fbf47c\\",\\"variantId\\":127,\\"productId\\":86,\\"name\\":\\"Pirlo Campari - Standard\\",\\"price\\":5,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	5	0	0	5	Card	66	Admin User	65	Bar	2026-02-11 09:48:07.476	0	\N	completed
157	"[{\\"id\\":\\"43a9f205-863d-47b3-a056-a572d0fbf47c\\",\\"variantId\\":127,\\"productId\\":86,\\"name\\":\\"Pirlo Campari - Standard\\",\\"price\\":5,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	5	0	0	5	Card	66	Admin User	65	Bar	2026-02-11 09:57:11.221	0	\N	completed
158	"[{\\"id\\":\\"9633c5ef-6e57-496c-b638-dee882509514\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":4,\\"effectiveTaxRate\\":0},{\\"id\\":\\"fb5fe2bc-23b7-474e-b22c-f9183650c2b8\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":4,\\"effectiveTaxRate\\":0},{\\"id\\":\\"1aa4dc55-d14d-4fdd-aa52-6b4e0f9022f2\\",\\"variantId\\":134,\\"productId\\":95,\\"name\\":\\"Vodka Shot - Standard\\",\\"price\\":3,\\"quantity\\":8,\\"effectiveTaxRate\\":0},{\\"id\\":\\"7b917ed1-ab08-4cfb-b9cd-2fcc8488e702\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":2,\\"effectiveTaxRate\\":0},{\\"id\\":\\"49130a04-2d91-488d-b3b8-d6205c761f5f\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":2,\\"effectiveTaxRate\\":0}]"	96	0	0	96	Card	66	Admin User	64	Cassa	2026-02-14 20:28:18.304	0	\N	completed
159	"[{\\"id\\":\\"426a8082-1651-4bf3-9f1b-8dcbd2e78833\\",\\"variantId\\":149,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":6,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	12	0	0	12	Card	66	Admin User	65	Bar	2026-02-14 23:58:56.925	0	\N	completed
160	"[{\\"id\\":\\"97028b71-c55b-4ad4-a3e7-1038f10518b9\\",\\"variantId\\":160,\\"productId\\":110,\\"name\\":\\"Wuhrer FF - Standard\\",\\"price\\":4,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	4	0	0	4	Card	66	Admin User	65	Bar	2026-02-15 01:01:21.17	0	\N	completed
161	"[{\\"id\\":\\"67f43ff5-9fd3-491f-8933-8f41748af9e3\\",\\"variantId\\":160,\\"productId\\":110,\\"name\\":\\"Wuhrer FF - Standard\\",\\"price\\":4,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	4	0	0	4	Card	66	Admin User	65	Bar	2026-02-15 01:48:56.398	0	\N	completed
162	"[{\\"id\\":\\"3942686b-d482-4408-93b6-1d21e0db7a8c\\",\\"variantId\\":134,\\"productId\\":95,\\"name\\":\\"Vodka Shot - Standard\\",\\"price\\":3,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	3	0	0	3	Card	66	Admin User	65	Bar	2026-02-15 02:32:05.409	0	\N	completed
163	"[{\\"id\\":\\"f358335e-3652-4628-bb17-0fc11f688382\\",\\"variantId\\":159,\\"productId\\":109,\\"name\\":\\"Becks FF - Standard\\",\\"price\\":3,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	3	0	0	3	Card	66	Admin User	65	Bar	2026-02-15 03:59:07.672	0	\N	completed
165	"[{\\"id\\":\\"5dcabfe2-46c1-47b7-bafa-1d0ffbac545d\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"cbd725ba-d8b4-40ba-9653-78c623cb9329\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	10	0	0	10	Card	66	Admin User	65	Bar	2026-02-15 17:25:41.844	0	\N	completed
169	"[{\\"id\\":\\"94446e2d-9bd7-4d6f-aebb-cf9c92a53faa\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	8	0	0	8	Card	66	Admin User	65	Bar	2026-02-15 17:51:38.883	0	\N	completed
174	"[{\\"id\\":\\"4d84e0d2-e1ad-4880-9747-1be09e735442\\",\\"variantId\\":149,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":6,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	6	0	0	6	Card	66	Admin User	65	Bar	2026-02-15 18:01:21.011	0	\N	completed
178	"[{\\"id\\":\\"01bee19c-ee14-4837-b501-bdcd149c962a\\",\\"variantId\\":150,\\"productId\\":93,\\"name\\":\\"Gin Lemon - Standard\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	8	0	0	8	Card	66	Admin User	65	Bar	2026-02-15 18:17:35.568	0	\N	completed
179	"[{\\"id\\":\\"9941d5bc-4282-4ee3-bdcf-d6fe47294c55\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	8	0	0	8	Card	66	Admin User	65	Bar	2026-02-15 18:17:46.081	0	\N	completed
182	"[{\\"id\\":\\"3a90dfb8-18ff-425c-b800-46dbca0f5ba2\\",\\"variantId\\":148,\\"productId\\":102,\\"name\\":\\"Birra Beck's - Standard\\",\\"price\\":4,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	4	0	0	4	Card	66	Admin User	65	Bar	2026-02-15 18:52:54.66	0	\N	completed
223	"[{\\"id\\":\\"297113d6-2dc7-4801-b178-f3afae053b6f\\",\\"variantId\\":127,\\"productId\\":86,\\"name\\":\\"Pirlo Campari - Standard\\",\\"price\\":5,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	5	0	0	5	Card	66	Admin User	65	Bar	2026-02-15 21:22:28.01	0	\N	completed
226	"[{\\"id\\":\\"ecdd186a-e732-4a68-863e-26c3c8c83c25\\",\\"variantId\\":127,\\"productId\\":86,\\"name\\":\\"Pirlo Campari - Standard\\",\\"price\\":5,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	10	0	0	10	Card	67	Bar	65	Bar	2026-02-15 21:23:07.081	0	\N	completed
244	"[{\\"id\\":\\"b373435f-d58d-4ef6-b304-f61f52ce9e16\\",\\"variantId\\":149,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":6,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19}]"	6	0	0	6	Card	67	Bar	65	Bar	2026-02-15 22:01:58.016	0	\N	completed
249	"[{\\"id\\":\\"0e872eb9-4caf-476c-87c9-900d2ba5e81f\\",\\"variantId\\":150,\\"productId\\":93,\\"name\\":\\"Gin Lemon - Standard\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"65b4ee1f-9635-4b76-ae9a-b40e7784c163\\",\\"variantId\\":148,\\"productId\\":102,\\"name\\":\\"Birra Beck's - Standard\\",\\"price\\":4,\\"quantity\\":4,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"a7316a42-b1ad-42ff-b3d0-e6793d7132e9\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":4,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"cb07c916-be69-44db-bcf3-484b17bb4b1b\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"591362a8-4594-4a87-a13c-f2c83545d478\\",\\"variantId\\":127,\\"productId\\":86,\\"name\\":\\"Pirlo Campari - Standard\\",\\"price\\":5,\\"quantity\\":4,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"943ca103-0e82-482c-a08e-0cfcf907e087\\",\\"variantId\\":149,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":6,\\"quantity\\":3,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"88d4787e-07c3-4b95-8f6f-605142721f24\\",\\"variantId\\":151,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"e954ae54-2420-4e91-8187-d9d1ce6b87ae\\",\\"variantId\\":169,\\"productId\\":96,\\"name\\":\\"Hierbas Shot - Standard\\",\\"price\\":3,\\"quantity\\":4,\\"effectiveTaxRate\\":0.19}]"	98	0	0	0	Card	66	Admin User	64	Cassa	2026-02-16 19:05:09.909	98	\N	complimentary
250	"[{\\"id\\":\\"e28acadb-f259-4a4b-9335-e9d48b9d1f2d\\",\\"variantId\\":149,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":6,\\"quantity\\":5,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"9fb3f414-afad-4fb2-82d9-8c9965996816\\",\\"variantId\\":127,\\"productId\\":86,\\"name\\":\\"Pirlo Campari - Standard\\",\\"price\\":5,\\"quantity\\":6,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"43b565f5-fa60-4ea8-83ab-6b4c52d2911a\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":3,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"6d84bf8d-4c63-4222-a221-b88433f9226e\\",\\"variantId\\":148,\\"productId\\":102,\\"name\\":\\"Birra Beck's - Standard\\",\\"price\\":4,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"932a8641-9ef8-41ca-a7c9-fbe6367c53a8\\",\\"variantId\\":169,\\"productId\\":96,\\"name\\":\\"Hierbas Shot - Standard\\",\\"price\\":3,\\"quantity\\":5,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"6bd1e51c-c26e-45ff-b53b-351b21cf3643\\",\\"variantId\\":119,\\"productId\\":89,\\"name\\":\\"Vodka Lemon - Standard\\",\\"price\\":8,\\"quantity\\":5,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"dfdfa12e-dd32-4a3d-b086-d58ee77c79b4\\",\\"variantId\\":151,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":17,\\"effectiveTaxRate\\":0.19},{\\"id\\":\\"d4e64b76-610b-4411-96ce-8557a297e386\\",\\"variantId\\":150,\\"productId\\":93,\\"name\\":\\"Gin Lemon - Standard\\",\\"price\\":8,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	299	0	0	0	Card	66	Admin User	64	Cassa	2026-02-16 19:05:27.644	299	\N	complimentary
251	"[{\\"id\\":\\"b5200dff-d262-4740-a82d-5896e87e8c39\\",\\"variantId\\":149,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":6,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	12	0	0	0	Card	66	Admin User	65	Bar	2026-02-16 19:35:41.805	12	\N	complimentary
252	"[{\\"id\\":\\"33bd4f27-35e6-41e5-ac73-14272cb99a53\\",\\"variantId\\":149,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":6,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	12	0	0	0	Card	66	Admin User	65	Bar	2026-02-16 22:30:57.524	12	\N	complimentary
253	"[{\\"id\\":\\"0f845f99-fcc9-4709-afc7-eab9050e657a\\",\\"variantId\\":148,\\"productId\\":102,\\"name\\":\\"Birra Beck's - Standard\\",\\"price\\":4,\\"quantity\\":2,\\"effectiveTaxRate\\":0.19}]"	8	0	0	0	Card	66	Admin User	65	Bar	2026-02-18 20:10:13.112	8	\N	complimentary
67	"[{\\"id\\":\\"74973007-63c8-4171-83cf-4142ac4b420c\\",\\"variantId\\":108,\\"productId\\":82,\\"name\\":\\"Birra Wuhrer - Bottle\\",\\"price\\":5,\\"quantity\\":5,\\"effectiveTaxRate\\":0},{\\"id\\":\\"ce0f9497-f0f7-485b-bb88-c53782019ccd\\",\\"variantId\\":134,\\"productId\\":95,\\"name\\":\\"Vodka Shot - Standard\\",\\"price\\":3,\\"quantity\\":10,\\"effectiveTaxRate\\":0},{\\"id\\":\\"b5224ab5-1f8c-40d1-b850-4af61fe5e2b7\\",\\"variantId\\":115,\\"productId\\":87,\\"name\\":\\"Tonica - Standard\\",\\"price\\":3,\\"quantity\\":1,\\"effectiveTaxRate\\":0},{\\"id\\":\\"7221ff64-8a66-479a-b746-041a2b473c0d\\",\\"variantId\\":131,\\"productId\\":92,\\"name\\":\\"Acqua Nat - Standard\\",\\"price\\":2,\\"quantity\\":3,\\"effectiveTaxRate\\":0},{\\"id\\":\\"30169206-a2ae-4253-ab52-dc78df61fbc4\\",\\"variantId\\":138,\\"productId\\":83,\\"name\\":\\"Vodka & Tonic - Normale\\",\\"price\\":8,\\"quantity\\":1,\\"effectiveTaxRate\\":0},{\\"id\\":\\"8047e400-571d-473d-8bf1-e4a894c58665\\",\\"variantId\\":117,\\"productId\\":85,\\"name\\":\\"Gin & Tonic - Standard\\",\\"price\\":8,\\"quantity\\":3,\\"effectiveTaxRate\\":0},{\\"id\\":\\"6300523a-6351-4653-8976-2e536dd37c84\\",\\"variantId\\":127,\\"productId\\":86,\\"name\\":\\"Pirlo Campari - Standard\\",\\"price\\":5,\\"quantity\\":1,\\"effectiveTaxRate\\":0}]"	101	0	0	101	Cash	65	Cassa	64	Cassa	2026-01-23 16:59:07.362	0	\N	completed
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: totalevo_user
--

COPY public.users (id, name, username, password, role, "tokensRevokedAt") FROM stdin;
66	Admin User	admin	$2b$10$DnuCsuapHLEMNfID1Sc4Au.V2pgLqAMBu6U0Pec8UJ/401biaSS5K	Admin	\N
67	Bar	bar	$2b$10$dRTOpXb5YRr0w0mWBprT5OBPKksj3Rg4PTG29UaQ3IdBOlh.QKTfu	Cashier	\N
65	Cassa	cassa	$2b$10$99cEqv0B2C.OqtVFjCUqjOI4pz4K0lZX1KQEwfwsk/29eoQIZdeYS	Cashier	\N
\.


--
-- Data for Name: variant_layouts; Type: TABLE DATA; Schema: public; Owner: totalevo_user
--

COPY public.variant_layouts (id, "tillId", "categoryId", "variantId", "gridColumn", "gridRow", "createdAt", "updatedAt", owner_id) FROM stdin;
95	65	82	150	1	2	2026-02-14 20:29:59.102	2026-02-14 20:29:59.102	66
96	65	82	119	2	2	2026-02-14 20:29:59.102	2026-02-14 20:29:59.102	66
97	65	82	138	2	1	2026-02-14 20:29:59.102	2026-02-14 20:29:59.102	66
98	65	82	137	1	3	2026-02-14 20:29:59.102	2026-02-14 20:29:59.102	66
99	65	82	151	1	1	2026-02-14 20:29:59.102	2026-02-14 20:29:59.102	66
100	65	82	127	4	1	2026-02-14 20:29:59.102	2026-02-14 20:29:59.102	66
101	65	83	116	1	1	2026-02-14 20:30:27.25	2026-02-14 20:30:27.25	66
103	65	83	131	4	1	2026-02-14 20:30:27.25	2026-02-14 20:30:27.25	66
37	64	-1	124	2	1	2026-02-10 21:20:10.288	2026-02-10 21:20:10.288	66
38	64	-1	126	4	1	2026-02-10 21:20:10.288	2026-02-10 21:20:10.288	66
118	65	86	140	1	1	2026-02-14 20:44:04.562	2026-02-14 20:44:04.562	66
119	65	86	148	3	1	2026-02-14 20:44:04.562	2026-02-14 20:44:04.562	66
120	65	86	159	3	1	2026-02-14 20:44:04.562	2026-02-14 20:44:04.562	66
121	65	86	157	4	1	2026-02-14 20:44:04.562	2026-02-14 20:44:04.562	66
122	65	86	155	1	2	2026-02-14 20:44:04.562	2026-02-14 20:44:04.562	66
123	65	86	160	3	2	2026-02-14 20:44:04.562	2026-02-14 20:44:04.562	66
125	65	86	153	4	3	2026-02-14 20:44:04.562	2026-02-14 20:44:04.562	66
126	65	86	162	2	1	2026-02-14 20:44:04.562	2026-02-14 20:44:04.562	66
127	65	86	163	2	2	2026-02-14 20:44:04.562	2026-02-14 20:44:04.562	66
53	65	80	129	4	1	2026-02-10 21:25:52.102	2026-02-10 21:25:52.102	66
54	65	80	128	1	1	2026-02-10 21:25:52.102	2026-02-10 21:25:52.102	66
128	65	86	161	1	3	2026-02-14 20:44:04.562	2026-02-14 20:44:04.562	66
138	65	-1	151	1	1	2026-02-15 02:35:45.514	2026-02-15 02:35:45.514	66
139	65	-1	138	2	1	2026-02-15 02:35:45.514	2026-02-15 02:35:45.514	66
140	65	-1	148	3	1	2026-02-15 02:35:45.514	2026-02-15 02:35:45.514	66
141	65	-1	127	4	1	2026-02-15 02:35:45.514	2026-02-15 02:35:45.514	66
142	65	-1	150	1	2	2026-02-15 02:35:45.514	2026-02-15 02:35:45.514	66
143	65	-1	119	2	2	2026-02-15 02:35:45.514	2026-02-15 02:35:45.514	66
144	65	-1	149	3	2	2026-02-15 02:35:45.514	2026-02-15 02:35:45.514	66
145	65	-1	131	4	2	2026-02-15 02:35:45.514	2026-02-15 02:35:45.514	66
146	65	-1	168	2	3	2026-02-15 02:35:45.514	2026-02-15 02:35:45.514	66
147	65	-1	169	3	3	2026-02-15 02:35:45.514	2026-02-15 02:35:45.514	66
\.


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: totalevo_user
--

SELECT pg_catalog.setval('public.categories_id_seq', 86, true);


--
-- Name: consumption_daily_summaries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: totalevo_user
--

SELECT pg_catalog.setval('public.consumption_daily_summaries_id_seq', 14, true);


--
-- Name: consumption_monthly_summaries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: totalevo_user
--

SELECT pg_catalog.setval('public.consumption_monthly_summaries_id_seq', 14, true);


--
-- Name: consumption_weekly_summaries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: totalevo_user
--

SELECT pg_catalog.setval('public.consumption_weekly_summaries_id_seq', 14, true);


--
-- Name: daily_closings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: totalevo_user
--

SELECT pg_catalog.setval('public.daily_closings_id_seq', 2, true);


--
-- Name: order_activity_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: totalevo_user
--

SELECT pg_catalog.setval('public.order_activity_logs_id_seq', 40, true);


--
-- Name: product_variants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: totalevo_user
--

SELECT pg_catalog.setval('public.product_variants_id_seq', 169, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: totalevo_user
--

SELECT pg_catalog.setval('public.products_id_seq', 110, true);


--
-- Name: settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: totalevo_user
--

SELECT pg_catalog.setval('public.settings_id_seq', 49, true);


--
-- Name: shared_layout_positions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: totalevo_user
--

SELECT pg_catalog.setval('public.shared_layout_positions_id_seq', 1, false);


--
-- Name: shared_layouts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: totalevo_user
--

SELECT pg_catalog.setval('public.shared_layouts_id_seq', 1, false);


--
-- Name: stock_adjustments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: totalevo_user
--

SELECT pg_catalog.setval('public.stock_adjustments_id_seq', 11, true);


--
-- Name: stock_consumptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: totalevo_user
--

SELECT pg_catalog.setval('public.stock_consumptions_id_seq', 190, true);


--
-- Name: tabs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: totalevo_user
--

SELECT pg_catalog.setval('public.tabs_id_seq', 7, true);


--
-- Name: tills_id_seq; Type: SEQUENCE SET; Schema: public; Owner: totalevo_user
--

SELECT pg_catalog.setval('public.tills_id_seq', 67, true);


--
-- Name: transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: totalevo_user
--

SELECT pg_catalog.setval('public.transactions_id_seq', 254, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: totalevo_user
--

SELECT pg_catalog.setval('public.users_id_seq', 67, true);


--
-- Name: variant_layouts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: totalevo_user
--

SELECT pg_catalog.setval('public.variant_layouts_id_seq', 147, true);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: consumption_daily_summaries consumption_daily_summaries_pkey; Type: CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.consumption_daily_summaries
    ADD CONSTRAINT consumption_daily_summaries_pkey PRIMARY KEY (id);


--
-- Name: consumption_daily_summaries consumption_daily_summaries_variantid_closingdate_key; Type: CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.consumption_daily_summaries
    ADD CONSTRAINT consumption_daily_summaries_variantid_closingdate_key UNIQUE (variantid, closingdate);


--
-- Name: consumption_monthly_summaries consumption_monthly_summaries_pkey; Type: CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.consumption_monthly_summaries
    ADD CONSTRAINT consumption_monthly_summaries_pkey PRIMARY KEY (id);


--
-- Name: consumption_monthly_summaries consumption_monthly_summaries_variantid_monthstart_key; Type: CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.consumption_monthly_summaries
    ADD CONSTRAINT consumption_monthly_summaries_variantid_monthstart_key UNIQUE (variantid, monthstart);


--
-- Name: consumption_weekly_summaries consumption_weekly_summaries_pkey; Type: CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.consumption_weekly_summaries
    ADD CONSTRAINT consumption_weekly_summaries_pkey PRIMARY KEY (id);


--
-- Name: consumption_weekly_summaries consumption_weekly_summaries_variantid_weekstart_key; Type: CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.consumption_weekly_summaries
    ADD CONSTRAINT consumption_weekly_summaries_variantid_weekstart_key UNIQUE (variantid, weekstart);


--
-- Name: daily_closings daily_closings_pkey; Type: CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.daily_closings
    ADD CONSTRAINT daily_closings_pkey PRIMARY KEY (id);


--
-- Name: order_activity_logs order_activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.order_activity_logs
    ADD CONSTRAINT order_activity_logs_pkey PRIMARY KEY (id);


--
-- Name: order_sessions order_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.order_sessions
    ADD CONSTRAINT order_sessions_pkey PRIMARY KEY (id);


--
-- Name: product_variants product_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: revoked_tokens revoked_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.revoked_tokens
    ADD CONSTRAINT revoked_tokens_pkey PRIMARY KEY (id);


--
-- Name: rooms rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_pkey PRIMARY KEY (id);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- Name: shared_layout_positions shared_layout_positions_pkey; Type: CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.shared_layout_positions
    ADD CONSTRAINT shared_layout_positions_pkey PRIMARY KEY (id);


--
-- Name: shared_layouts shared_layouts_pkey; Type: CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.shared_layouts
    ADD CONSTRAINT shared_layouts_pkey PRIMARY KEY (id);


--
-- Name: stock_adjustments stock_adjustments_pkey; Type: CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.stock_adjustments
    ADD CONSTRAINT stock_adjustments_pkey PRIMARY KEY (id);


--
-- Name: stock_consumptions stock_consumptions_pkey; Type: CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.stock_consumptions
    ADD CONSTRAINT stock_consumptions_pkey PRIMARY KEY (id);


--
-- Name: stock_items stock_items_pkey; Type: CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.stock_items
    ADD CONSTRAINT stock_items_pkey PRIMARY KEY (id);


--
-- Name: tables tables_pkey; Type: CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.tables
    ADD CONSTRAINT tables_pkey PRIMARY KEY (id);


--
-- Name: tabs tabs_pkey; Type: CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.tabs
    ADD CONSTRAINT tabs_pkey PRIMARY KEY (id);


--
-- Name: tills tills_pkey; Type: CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.tills
    ADD CONSTRAINT tills_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: variant_layouts variant_layouts_pkey; Type: CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.variant_layouts
    ADD CONSTRAINT variant_layouts_pkey PRIMARY KEY (id);


--
-- Name: Transaction_createdAt_idx; Type: INDEX; Schema: public; Owner: totalevo_user
--

CREATE INDEX "Transaction_createdAt_idx" ON public.transactions USING btree ("createdAt");


--
-- Name: idx_consumption_daily_summary_date_variant; Type: INDEX; Schema: public; Owner: totalevo_user
--

CREATE INDEX idx_consumption_daily_summary_date_variant ON public.consumption_daily_summaries USING btree (closingdate, variantid);


--
-- Name: idx_consumption_daily_summary_variant; Type: INDEX; Schema: public; Owner: totalevo_user
--

CREATE INDEX idx_consumption_daily_summary_variant ON public.consumption_daily_summaries USING btree (variantid);


--
-- Name: idx_consumption_monthly_summary_date_variant; Type: INDEX; Schema: public; Owner: totalevo_user
--

CREATE INDEX idx_consumption_monthly_summary_date_variant ON public.consumption_monthly_summaries USING btree (monthstart, variantid);


--
-- Name: idx_consumption_weekly_summary_date_variant; Type: INDEX; Schema: public; Owner: totalevo_user
--

CREATE INDEX idx_consumption_weekly_summary_date_variant ON public.consumption_weekly_summaries USING btree (weekstart, variantid);


--
-- Name: revoked_tokens_expiresAt_idx; Type: INDEX; Schema: public; Owner: totalevo_user
--

CREATE INDEX "revoked_tokens_expiresAt_idx" ON public.revoked_tokens USING btree ("expiresAt");


--
-- Name: revoked_tokens_tokenDigest_key; Type: INDEX; Schema: public; Owner: totalevo_user
--

CREATE UNIQUE INDEX "revoked_tokens_tokenDigest_key" ON public.revoked_tokens USING btree ("tokenDigest");


--
-- Name: revoked_tokens_userId_idx; Type: INDEX; Schema: public; Owner: totalevo_user
--

CREATE INDEX "revoked_tokens_userId_idx" ON public.revoked_tokens USING btree ("userId");


--
-- Name: shared_layout_positions_sharedLayoutId_idx; Type: INDEX; Schema: public; Owner: totalevo_user
--

CREATE INDEX "shared_layout_positions_sharedLayoutId_idx" ON public.shared_layout_positions USING btree ("sharedLayoutId");


--
-- Name: shared_layout_positions_sharedLayoutId_variantId_key; Type: INDEX; Schema: public; Owner: totalevo_user
--

CREATE UNIQUE INDEX "shared_layout_positions_sharedLayoutId_variantId_key" ON public.shared_layout_positions USING btree ("sharedLayoutId", "variantId");


--
-- Name: shared_layouts_owner_id_idx; Type: INDEX; Schema: public; Owner: totalevo_user
--

CREATE INDEX shared_layouts_owner_id_idx ON public.shared_layouts USING btree (owner_id);


--
-- Name: tables_owner_id_idx; Type: INDEX; Schema: public; Owner: totalevo_user
--

CREATE INDEX tables_owner_id_idx ON public.tables USING btree (owner_id);


--
-- Name: tables_roomId_idx; Type: INDEX; Schema: public; Owner: totalevo_user
--

CREATE INDEX "tables_roomId_idx" ON public.tables USING btree ("roomId");


--
-- Name: tabs_tableId_idx; Type: INDEX; Schema: public; Owner: totalevo_user
--

CREATE INDEX "tabs_tableId_idx" ON public.tabs USING btree ("tableId");


--
-- Name: users_username_key; Type: INDEX; Schema: public; Owner: totalevo_user
--

CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);


--
-- Name: variant_layouts_owner_id_idx; Type: INDEX; Schema: public; Owner: totalevo_user
--

CREATE INDEX variant_layouts_owner_id_idx ON public.variant_layouts USING btree (owner_id);


--
-- Name: variant_layouts_tillId_categoryId_idx; Type: INDEX; Schema: public; Owner: totalevo_user
--

CREATE INDEX "variant_layouts_tillId_categoryId_idx" ON public.variant_layouts USING btree ("tillId", "categoryId");


--
-- Name: variant_layouts_tillId_categoryId_variantId_key; Type: INDEX; Schema: public; Owner: totalevo_user
--

CREATE UNIQUE INDEX "variant_layouts_tillId_categoryId_variantId_key" ON public.variant_layouts USING btree ("tillId", "categoryId", "variantId");


--
-- Name: daily_closings daily_closings_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.daily_closings
    ADD CONSTRAINT "daily_closings_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: consumption_daily_summaries fk_daily_closing; Type: FK CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.consumption_daily_summaries
    ADD CONSTRAINT fk_daily_closing FOREIGN KEY (dailyclosingid) REFERENCES public.daily_closings(id) ON DELETE SET NULL;


--
-- Name: consumption_daily_summaries fk_variant; Type: FK CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.consumption_daily_summaries
    ADD CONSTRAINT fk_variant FOREIGN KEY (variantid) REFERENCES public.product_variants(id) ON DELETE CASCADE;


--
-- Name: consumption_monthly_summaries fk_variant_monthly; Type: FK CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.consumption_monthly_summaries
    ADD CONSTRAINT fk_variant_monthly FOREIGN KEY (variantid) REFERENCES public.product_variants(id) ON DELETE CASCADE;


--
-- Name: consumption_weekly_summaries fk_variant_weekly; Type: FK CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.consumption_weekly_summaries
    ADD CONSTRAINT fk_variant_weekly FOREIGN KEY (variantid) REFERENCES public.product_variants(id) ON DELETE CASCADE;


--
-- Name: order_activity_logs order_activity_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.order_activity_logs
    ADD CONSTRAINT "order_activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: order_sessions order_sessions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.order_sessions
    ADD CONSTRAINT "order_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id);


--
-- Name: product_variants product_variants_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: products products_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: revoked_tokens revoked_tokens_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.revoked_tokens
    ADD CONSTRAINT "revoked_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: shared_layout_positions shared_layout_positions_sharedLayoutId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.shared_layout_positions
    ADD CONSTRAINT "shared_layout_positions_sharedLayoutId_fkey" FOREIGN KEY ("sharedLayoutId") REFERENCES public.shared_layouts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: shared_layout_positions shared_layout_positions_variantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.shared_layout_positions
    ADD CONSTRAINT "shared_layout_positions_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES public.product_variants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: shared_layouts shared_layouts_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.shared_layouts
    ADD CONSTRAINT shared_layouts_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: stock_adjustments stock_adjustments_stockItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.stock_adjustments
    ADD CONSTRAINT "stock_adjustments_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES public.stock_items(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: stock_adjustments stock_adjustments_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.stock_adjustments
    ADD CONSTRAINT "stock_adjustments_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: stock_consumptions stock_consumptions_stockItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.stock_consumptions
    ADD CONSTRAINT "stock_consumptions_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES public.stock_items(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: stock_consumptions stock_consumptions_variantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.stock_consumptions
    ADD CONSTRAINT "stock_consumptions_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES public.product_variants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: tables tables_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.tables
    ADD CONSTRAINT tables_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tables tables_roomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.tables
    ADD CONSTRAINT "tables_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES public.rooms(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tabs tabs_tableId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.tabs
    ADD CONSTRAINT "tabs_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES public.tables(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: transactions transactions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: variant_layouts variant_layouts_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.variant_layouts
    ADD CONSTRAINT variant_layouts_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: variant_layouts variant_layouts_tillId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.variant_layouts
    ADD CONSTRAINT "variant_layouts_tillId_fkey" FOREIGN KEY ("tillId") REFERENCES public.tills(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: variant_layouts variant_layouts_variantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: totalevo_user
--

ALTER TABLE ONLY public.variant_layouts
    ADD CONSTRAINT "variant_layouts_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES public.product_variants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict FLOF0jZpuHuJcNzdigAGL9EEJL7ZKCMM3fV98ZHR7FMFF341GxRUg71zu7kKNWv

