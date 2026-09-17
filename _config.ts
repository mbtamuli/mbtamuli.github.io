import lume from "lume/mod.ts";
import me from "https://deno.land/x/lume_theme_simple_me/mod.ts";

const site = lume({
  location: new URL("https://mriyam.dev"),
});

site.use(me());

export default site;
