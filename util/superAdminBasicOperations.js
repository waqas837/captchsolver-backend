const { pool } = require("../Database/databaseConnection/DbConnect");

// Subscription Plan CRUD Operations
const subscriptionPlanQueries = {
  createPlan: async (plan) => {
    const connection = await pool.getConnection();
    try {
      const query = `
          INSERT INTO subscription_plans (id, name, price, type) 
          VALUES (?, ?, ?, ?)
        `;
      return await connection.query(query, [
        plan.id,
        plan.name,
        plan.price,
        plan.type,
      ]);
    } finally {
      connection.release();
    }
  },

  getAllPlans: async () => {
    const connection = await pool.getConnection();
    try {
      const query = `
          SELECT * FROM subscription_plans 
          WHERE status = 'active'
          ORDER BY created_at DESC
        `;
      return await connection.query(query);
    } finally {
      connection.release();
    }
  },

  updatePlan: async (plan) => {
    const connection = await pool.getConnection();
    try {
      const query = `
          UPDATE subscription_plans 
          SET name = ?, price = ?, type=?
          WHERE id = ?
        `;
      return await connection.query(query, [
        plan.name,
        plan.price,
        plan.type,
        plan.id,
      ]);
    } finally {
      connection.release();
    }
  },

  deletePlan: async (id) => {
    const connection = await pool.getConnection();
    try {
      const query = `
          DELETE FROM subscription_plans WHERE id = ?
        `;
      return await connection.query(query, [id]);
    } finally {
      connection.release();
    }
  },
};

module.exports = {
  ...subscriptionPlanQueries,
};
