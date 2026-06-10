-- De app gebruikt @@unique([userId, matchId, poolId]) — één voorspelling per
-- wedstrijd PER POOL. In productie bestond echter nog de oude unieke constraint
-- op alleen (userId, matchId), waardoor dezelfde wedstrijd in een tweede pool
-- voorspellen crashte met P2002. Verwijder die stale constraint/index definitief.

-- 1. Verwijder op de Prisma-standaardnaam (zowel als constraint als losse index)
ALTER TABLE "Prediction" DROP CONSTRAINT IF EXISTS "Prediction_userId_matchId_key";
DROP INDEX IF EXISTS "Prediction_userId_matchId_key";

-- 2. Vangnet: verwijder elke overgebleven UNIEKE constraint die exact
--    (userId, matchId) afdekt, ongeacht de naam. De gewenste
--    (userId, matchId, poolId)-constraint (3 kolommen) blijft staan.
DO $$
DECLARE
  c text;
BEGIN
  FOR c IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'Prediction'
      AND con.contype = 'u'
      AND (
        SELECT array_agg(att.attname ORDER BY att.attname)
        FROM unnest(con.conkey) AS cols(attnum)
        JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = cols.attnum
      ) = ARRAY['matchId','userId']
  LOOP
    EXECUTE format('ALTER TABLE "Prediction" DROP CONSTRAINT %I', c);
  END LOOP;
END $$;
