import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://zdxpouoysgmwlcajshyp.supabase.co";

const supabaseKey = "sb_publishable_aLOTInw_XG3gm0afxjQ7fg_8XYTmUqs";

export const supabase = createClient(supabaseUrl, supabaseKey);