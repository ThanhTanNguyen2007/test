UPDATE "Manager"
	SET "creditLineState"='SHARED'
	WHERE "creditLineAllocationConfigId" IS NOT NULL;