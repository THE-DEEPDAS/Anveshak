import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
      index: true,
    },
    linkedIn: {
      type: String,
      trim: true,
    },
    domains: [
      {
        type: String,
        trim: true,
      },
    ],
    industry: [
      {
        type: String,
        trim: true,
      },
    ],
    technologiesUsed: [
      {
        name: {
          type: String,
          trim: true,
        },
        category: {
          type: String,
          enum: [
            "language",
            "framework",
            "database",
            "cloud",
            "tool",
            "other",
            "platform",
            "technology",
            "field",
          ],
        },
        expertise: {
          type: String,
          enum: ["primary", "secondary", "occasional"],
        },
      },
    ],
    openRoles: [
      {
        title: {
          type: String,
          required: true,
        },
        department: String,
        skills: [
          {
            name: String,
            required: Boolean,
            priority: {
              type: String,
              enum: ["must-have", "preferred", "nice-to-have"],
              default: "must-have",
            },
          },
        ],
        experience: {
          min: Number,
          max: Number,
          level: {
            type: String,
            enum: [
              "entry",
              "junior",
              "mid",
              "mid-senior",
              "senior",
              "lead",
              "architect",
            ],
          },
        },
        location: {
          city: String,
          state: String,
          country: String,
          remote: {
            type: String,
            enum: ["no", "hybrid", "full", "optional", "onsite"],
            default: "no",
          },
        },
        active: {
          type: Boolean,
          default: true,
        },
        postedDate: Date,
        updatedDate: Date,
      },
    ],
    size: {
      type: String,
      enum: [
        "1-10",
        "11-50",
        "51-200",
        "201-500",
        "501-1000",
        "1001-5000",
        "5001-10000",
        "10001-50000",
        "50001-100000",
        "100000+",
        "101-500",
        "500000+",
      ],
    },
    funding: {
      status: {
        type: String,
        enum: [
          "bootstrapped",
          "seed",
          "series-a",
          "series-b",
          "series-c",
          "series-d",
          "series-e",
          "series-f",
          "series-g",
          "pre-ipo",
          "ipo",
          "public",
          "acquired",
          "spac",
          "other",
        ],
      },
      totalAmount: String,
      lastRound: {
        type: {
          type: String,
          required: true,
        },
        amount: {
          type: String,
          required: true,
        },
        date: {
          type: Date,
          required: true,
        },
        investors: [String],
      },
    },
    location: {
      headquarters: {
        city: String,
        state: String,
        country: String,
      },
      offices: [
        {
          city: String,
          state: String,
          country: String,
          type: {
            type: String,
            enum: [
              "headquarters",
              "regional",
              "development",
              "sales",
              "support",
            ],
          },
        },
      ],
    },
    contact: {
      email: String,
      phone: String,
      social: {
        twitter: String,
        facebook: String,
        github: String,
      },
    },
    products: [
      {
        name: String,
        description: String,
        type: {
          type: String,
          enum: ["software", "hardware", "service", "biotech", "other"],
        },
        technologies: [String],
      },
    ],
    researchAreas: [
      {
        area: String,
        description: String,
        active: {
          type: Boolean,
          default: true,
        },
      },
    ],
    companyType: {
      type: String,
      enum: [
        "startup",
        "product",
        "service",
        "consulting",
        "enterprise",
        "research",
      ],
    },
    workCulture: [
      {
        type: String,
        enum: [
          "remote-first",
          "office-first",
          "hybrid",
          "flexible",
          "startup-culture",
          "work-life-balance",
          "agile",
          "innovative",
        ],
      },
    ],
    benefits: [
      {
        type: String,
        enum: [
          "health-insurance",
          "life-insurance",
          "stock-options",
          "flexible-hours",
          "remote-work",
          "paid-vacation",
          "professional-development",
          "gym-membership",
          "parental-leave",
        ],
      },
    ],
    dataSources: [
      {
        source: String,
        url: String,
        lastScraped: Date,
        lastVerified: Date,
        confidence: {
          type: Number,
          min: 0,
          max: 1,
        },
      },
    ],
    verificationStatus: {
      isVerified: {
        type: Boolean,
        default: false,
      },
      lastVerified: Date,
      verificationMethod: {
        type: String,
        enum: ["manual", "automated", "api", "unverified"],
        default: "unverified",
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Add text search index
companySchema.index({
  name: "text",
  "openRoles.title": "text",
  technologiesUsed: "text",
  description: "text",
});

// Add compound indexes for better search performance
companySchema.index({ name: 1, "location.headquarters.country": 1 });
companySchema.index({ industry: 1, size: 1 });
companySchema.index({ "technologiesUsed.name": 1 });
companySchema.index({ "openRoles.skills.name": 1 });
companySchema.index({ "verificationStatus.isVerified": 1, updatedAt: -1 });

// Add text index for full-text search
companySchema.index({
  name: "text",
  description: "text",
  "products.name": "text",
  "products.description": "text",
  "researchAreas.area": "text",
  "researchAreas.description": "text",
});

// Virtual for the company age
companySchema.virtual("age").get(function () {
  if (this.createdAt) {
    const diffTime = Math.abs(new Date() - this.createdAt);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 365));
  }
  return null;
});

// Method to check if company has specific technology
companySchema.methods.hasTechnology = function (techName) {
  return this.technologiesUsed.some(
    (tech) => tech.name.toLowerCase() === techName.toLowerCase()
  );
};

// Method to get active job openings
companySchema.methods.getActiveJobs = function () {
  return this.openRoles.filter((role) => role.active);
};

// Method to check skill match percentage
companySchema.methods.getSkillMatchPercentage = function (candidateSkills) {
  if (!candidateSkills || !candidateSkills.length) return 0;

  const companySkills = new Set(
    this.technologiesUsed.map((tech) => tech.name.toLowerCase())
  );

  const matches = candidateSkills.filter((skill) =>
    companySkills.has(skill.toLowerCase())
  );

  return (matches.length / candidateSkills.length) * 100;
};

// Pre-save middleware to update timestamps
companySchema.pre("save", function (next) {
  if (this.openRoles) {
    this.openRoles.forEach((role) => {
      if (!role.postedDate) {
        role.postedDate = new Date();
      }
      role.updatedDate = new Date();
    });
  }
  next();
});

const Company = mongoose.model("Company", companySchema);
export default Company;
