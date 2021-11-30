UPDATE "User"
	SET status='Completed'
	WHERE id In (SELECT u.id FROM "User" u INNER JOIN "Account" acc ON u.id= acc."userId" GROUP BY u.id HAVING COUNT(*) > 0);