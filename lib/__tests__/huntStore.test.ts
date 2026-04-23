import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import {
  getAllHunts,
  getAllHuntsIncludingPrivate,
  getCreatorHunts,
  getHuntsByCreator,
  updateHuntStatus,
  getHuntById,
  addHunt,
  getHuntClues,
  saveClueLocally,
  getHunt,
  getFeaturedHunts,
} from "@/lib/huntStore"
import type { StoredHunt, Clue } from "@/lib/types"

describe("huntStore", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe("getAllHunts", () => {
    it("returns only public active hunts", () => {
      const hunts = getAllHunts()
      expect(Array.isArray(hunts)).toBe(true)
      expect(hunts.every((h) => !h.is_private)).toBe(true)
    })

    it("filters out private hunts", () => {
      const hunt: StoredHunt = {
        id: 999,
        title: "Private Hunt",
        description: "Should not appear",
        cluesCount: 0,
        status: "Active",
        rewardType: "XLM",
        is_private: true,
      }
      addHunt(hunt)
      const hunts = getAllHunts()
      expect(hunts.find((h) => h.id === 999)).toBeUndefined()
    })

    it("includes public active hunts", () => {
      const hunt: StoredHunt = {
        id: 998,
        title: "Public Hunt",
        description: "Should appear",
        cluesCount: 3,
        status: "Active",
        rewardType: "NFT",
        is_private: false,
      }
      addHunt(hunt)
      const hunts = getAllHunts()
      expect(hunts.find((h) => h.id === 998)).toBeDefined()
    })
  })

  describe("getAllHuntsIncludingPrivate", () => {
    it("returns all hunts including private ones", () => {
      const hunt: StoredHunt = {
        id: 997,
        title: "Private Hunt",
        description: "Should appear here",
        cluesCount: 2,
        status: "Draft",
        rewardType: "Both",
        is_private: true,
      }
      addHunt(hunt)
      const hunts = getAllHuntsIncludingPrivate()
      expect(hunts.find((h) => h.id === 997)).toBeDefined()
    })

    it("returns both public and private hunts", () => {
      const publicHunt: StoredHunt = {
        id: 996,
        title: "Public",
        description: "Public hunt",
        cluesCount: 1,
        status: "Active",
        rewardType: "XLM",
        is_private: false,
      }
      const privateHunt: StoredHunt = {
        id: 995,
        title: "Private",
        description: "Private hunt",
        cluesCount: 1,
        status: "Active",
        rewardType: "XLM",
        is_private: true,
      }
      addHunt(publicHunt)
      addHunt(privateHunt)
      const hunts = getAllHuntsIncludingPrivate()
      expect(hunts.find((h) => h.id === 996)).toBeDefined()
      expect(hunts.find((h) => h.id === 995)).toBeDefined()
    })
  })

  describe("getCreatorHunts", () => {
    it("returns all hunts for creator dashboard", () => {
      const hunts = getCreatorHunts()
      expect(Array.isArray(hunts)).toBe(true)
    })

    it("includes draft hunts", () => {
      const hunt: StoredHunt = {
        id: 994,
        title: "Draft Hunt",
        description: "Draft",
        cluesCount: 0,
        status: "Draft",
        rewardType: "XLM",
      }
      addHunt(hunt)
      const hunts = getCreatorHunts()
      expect(hunts.find((h) => h.id === 994)).toBeDefined()
    })
  })

  describe("getHuntsByCreator", () => {
    it("returns hunts for a creator", () => {
      const hunts = getHuntsByCreator()
      expect(Array.isArray(hunts)).toBe(true)
    })
  })

  describe("updateHuntStatus", () => {
    it("updates hunt status from Draft to Active", () => {
      const hunt: StoredHunt = {
        id: 993,
        title: "Test Hunt",
        description: "Test",
        cluesCount: 1,
        status: "Draft",
        rewardType: "XLM",
      }
      addHunt(hunt)
      updateHuntStatus(993, "Active")
      const updated = getHuntById(993)
      expect(updated?.status).toBe("Active")
    })

    it("updates hunt status from Active to Completed", () => {
      const hunt: StoredHunt = {
        id: 992,
        title: "Test Hunt",
        description: "Test",
        cluesCount: 1,
        status: "Active",
        rewardType: "XLM",
      }
      addHunt(hunt)
      updateHuntStatus(992, "Completed")
      const updated = getHuntById(992)
      expect(updated?.status).toBe("Completed")
    })

    it("does not affect other hunts when updating one", () => {
      const hunt1: StoredHunt = {
        id: 991,
        title: "Hunt 1",
        description: "Test",
        cluesCount: 1,
        status: "Draft",
        rewardType: "XLM",
      }
      const hunt2: StoredHunt = {
        id: 990,
        title: "Hunt 2",
        description: "Test",
        cluesCount: 1,
        status: "Draft",
        rewardType: "XLM",
      }
      addHunt(hunt1)
      addHunt(hunt2)
      updateHuntStatus(991, "Active")
      const h1 = getHuntById(991)
      const h2 = getHuntById(990)
      expect(h1?.status).toBe("Active")
      expect(h2?.status).toBe("Draft")
    })
  })

  describe("getHuntById", () => {
    it("returns a hunt by ID", () => {
      const hunt: StoredHunt = {
        id: 989,
        title: "Test Hunt",
        description: "Test",
        cluesCount: 2,
        status: "Active",
        rewardType: "NFT",
      }
      addHunt(hunt)
      const found = getHuntById(989)
      expect(found).toEqual(hunt)
    })

    it("returns undefined for non-existent hunt", () => {
      const found = getHuntById(99999)
      expect(found).toBeUndefined()
    })
  })

  describe("addHunt", () => {
    it("adds a new hunt to storage", () => {
      const hunt: StoredHunt = {
        id: 988,
        title: "New Hunt",
        description: "New",
        cluesCount: 0,
        status: "Draft",
        rewardType: "XLM",
      }
      addHunt(hunt)
      const found = getHuntById(988)
      expect(found).toEqual(hunt)
    })

    it("does not add duplicate hunts with same ID", () => {
      const hunt: StoredHunt = {
        id: 987,
        title: "Hunt",
        description: "Test",
        cluesCount: 0,
        status: "Draft",
        rewardType: "XLM",
      }
      addHunt(hunt)
      addHunt(hunt)
      const allHunts = getAllHuntsIncludingPrivate()
      const matches = allHunts.filter((h) => h.id === 987)
      expect(matches.length).toBe(1)
    })

    it("persists hunt to localStorage", () => {
      const hunt: StoredHunt = {
        id: 986,
        title: "Persisted Hunt",
        description: "Test",
        cluesCount: 1,
        status: "Active",
        rewardType: "Both",
      }
      addHunt(hunt)
      const stored = localStorage.getItem("hunty_hunts")
      expect(stored).toBeTruthy()
      const parsed = JSON.parse(stored!)
      expect(parsed.some((h: StoredHunt) => h.id === 986)).toBe(true)
    })
  })

  describe("getHuntClues", () => {
    it("returns clues for a specific hunt", () => {
      const clues = getHuntClues(1)
      expect(Array.isArray(clues)).toBe(true)
    })

    it("returns empty array for hunt with no clues", () => {
      const clues = getHuntClues(99999)
      expect(clues).toEqual([])
    })

    it("filters clues by huntId", () => {
      const clue1: Clue = {
        id: 1,
        huntId: 985,
        question: "Q1",
        answer: "A1",
        points: 10,
      }
      const clue2: Clue = {
        id: 2,
        huntId: 984,
        question: "Q2",
        answer: "A2",
        points: 20,
      }
      // Manually add to localStorage for testing
      localStorage.setItem("hunty_clues", JSON.stringify([clue1, clue2]))
      const clues985 = getHuntClues(985)
      const clues984 = getHuntClues(984)
      expect(clues985.length).toBe(1)
      expect(clues985[0].huntId).toBe(985)
      expect(clues984.length).toBe(1)
      expect(clues984[0].huntId).toBe(984)
    })
  })

  describe("saveClueLocally", () => {
    it("saves a new clue and increments cluesCount", () => {
      const hunt: StoredHunt = {
        id: 983,
        title: "Hunt",
        description: "Test",
        cluesCount: 0,
        status: "Draft",
        rewardType: "XLM",
      }
      addHunt(hunt)
      saveClueLocally({
        huntId: 983,
        question: "What is 2+2?",
        answer: "4",
        points: 10,
      })
      const updated = getHuntById(983)
      expect(updated?.cluesCount).toBe(1)
    })

    it("persists clue to localStorage", () => {
      const hunt: StoredHunt = {
        id: 982,
        title: "Hunt",
        description: "Test",
        cluesCount: 0,
        status: "Draft",
        rewardType: "XLM",
      }
      addHunt(hunt)
      saveClueLocally({
        huntId: 982,
        question: "Test question",
        answer: "test answer",
        points: 15,
      })
      const stored = localStorage.getItem("hunty_clues")
      expect(stored).toBeTruthy()
      const parsed = JSON.parse(stored!)
      expect(parsed.some((c: Clue) => c.huntId === 982)).toBe(true)
    })

    it("increments clue ID correctly", () => {
      const hunt: StoredHunt = {
        id: 981,
        title: "Hunt",
        description: "Test",
        cluesCount: 0,
        status: "Draft",
        rewardType: "XLM",
      }
      addHunt(hunt)
      saveClueLocally({
        huntId: 981,
        question: "Q1",
        answer: "A1",
        points: 10,
      })
      saveClueLocally({
        huntId: 981,
        question: "Q2",
        answer: "A2",
        points: 20,
      })
      const clues = getHuntClues(981)
      expect(clues.length).toBe(2)
      expect(clues[0].id).not.toBe(clues[1].id)
    })

    it("handles multiple clues for same hunt", () => {
      const hunt: StoredHunt = {
        id: 980,
        title: "Hunt",
        description: "Test",
        cluesCount: 0,
        status: "Draft",
        rewardType: "XLM",
      }
      addHunt(hunt)
      for (let i = 0; i < 3; i++) {
        saveClueLocally({
          huntId: 980,
          question: `Question ${i}`,
          answer: `Answer ${i}`,
          points: 10 + i * 5,
        })
      }
      const updated = getHuntById(980)
      expect(updated?.cluesCount).toBe(3)
      const clues = getHuntClues(980)
      expect(clues.length).toBe(3)
    })
  })

  describe("getHunt", () => {
    it("returns a hunt by string ID", () => {
      const hunt: StoredHunt = {
        id: 979,
        title: "Test Hunt",
        description: "Test",
        cluesCount: 1,
        status: "Active",
        rewardType: "XLM",
      }
      addHunt(hunt)
      const found = getHunt("979")
      expect(found).toEqual(hunt)
    })

    it("returns undefined for non-existent string ID", () => {
      const found = getHunt("99999")
      expect(found).toBeUndefined()
    })

    it("converts string ID to number correctly", () => {
      const hunt: StoredHunt = {
        id: 978,
        title: "Test",
        description: "Test",
        cluesCount: 0,
        status: "Draft",
        rewardType: "XLM",
      }
      addHunt(hunt)
      const found = getHunt("978")
      expect(found?.id).toBe(978)
    })
  })

  describe("getFeaturedHunts", () => {
    it("returns featured hunts sorted by score", () => {
      const hunt1: StoredHunt = {
        id: 977,
        title: "Hunt 1",
        description: "Test",
        cluesCount: 5,
        status: "Active",
        rewardType: "Both",
        is_private: false,
        startTime: Math.floor(Date.now() / 1000) - 86400,
        endTime: Math.floor(Date.now() / 1000) + 7 * 86400,
      }
      const hunt2: StoredHunt = {
        id: 976,
        title: "Hunt 2",
        description: "Test",
        cluesCount: 2,
        status: "Active",
        rewardType: "XLM",
        is_private: false,
        startTime: Math.floor(Date.now() / 1000) - 86400,
        endTime: Math.floor(Date.now() / 1000) + 7 * 86400,
      }
      addHunt(hunt1)
      addHunt(hunt2)
      const featured = getFeaturedHunts(2)
      expect(featured.length).toBeGreaterThan(0)
      expect(featured[0].cluesCount).toBeGreaterThanOrEqual(featured[1]?.cluesCount || 0)
    })

    it("respects limit parameter", () => {
      const featured = getFeaturedHunts(1)
      expect(featured.length).toBeLessThanOrEqual(1)
    })

    it("returns only active public hunts", () => {
      const featured = getFeaturedHunts(10)
      expect(featured.every((h) => h.status === "Active" && !h.is_private)).toBe(true)
    })

    it("prioritizes hunts with more clues", () => {
      const hunt1: StoredHunt = {
        id: 975,
        title: "Many Clues",
        description: "Test",
        cluesCount: 10,
        status: "Active",
        rewardType: "XLM",
        is_private: false,
        startTime: Math.floor(Date.now() / 1000),
        endTime: Math.floor(Date.now() / 1000) + 86400,
      }
      const hunt2: StoredHunt = {
        id: 974,
        title: "Few Clues",
        description: "Test",
        cluesCount: 1,
        status: "Active",
        rewardType: "XLM",
        is_private: false,
        startTime: Math.floor(Date.now() / 1000),
        endTime: Math.floor(Date.now() / 1000) + 86400,
      }
      addHunt(hunt1)
      addHunt(hunt2)
      const featured = getFeaturedHunts(2)
      if (featured.length >= 2) {
        const manyCluesIndex = featured.findIndex((h) => h.id === 975)
        const fewCluesIndex = featured.findIndex((h) => h.id === 974)
        if (manyCluesIndex !== -1 && fewCluesIndex !== -1) {
          expect(manyCluesIndex).toBeLessThan(fewCluesIndex)
        }
      }
    })

    it("prioritizes Both reward type over single rewards", () => {
      const hunt1: StoredHunt = {
        id: 973,
        title: "Both Rewards",
        description: "Test",
        cluesCount: 3,
        status: "Active",
        rewardType: "Both",
        is_private: false,
        startTime: Math.floor(Date.now() / 1000),
        endTime: Math.floor(Date.now() / 1000) + 86400,
      }
      const hunt2: StoredHunt = {
        id: 972,
        title: "XLM Only",
        description: "Test",
        cluesCount: 3,
        status: "Active",
        rewardType: "XLM",
        is_private: false,
        startTime: Math.floor(Date.now() / 1000),
        endTime: Math.floor(Date.now() / 1000) + 86400,
      }
      addHunt(hunt1)
      addHunt(hunt2)
      const featured = getFeaturedHunts(2)
      if (featured.length >= 2) {
        const bothIndex = featured.findIndex((h) => h.id === 973)
        const xlmIndex = featured.findIndex((h) => h.id === 972)
        if (bothIndex !== -1 && xlmIndex !== -1) {
          expect(bothIndex).toBeLessThan(xlmIndex)
        }
      }
    })
  })

  describe("localStorage persistence", () => {
    it("recovers hunts from localStorage on read", () => {
      const hunt: StoredHunt = {
        id: 971,
        title: "Persistent Hunt",
        description: "Test",
        cluesCount: 2,
        status: "Active",
        rewardType: "NFT",
      }
      addHunt(hunt)
      const stored = localStorage.getItem("hunty_hunts")
      expect(stored).toBeTruthy()
      const found = getHuntById(971)
      expect(found).toEqual(hunt)
    })

    it("handles corrupted localStorage gracefully", () => {
      localStorage.setItem("hunty_hunts", "invalid json {")
      const hunts = getAllHuntsIncludingPrivate()
      expect(Array.isArray(hunts)).toBe(true)
    })

    it("handles missing localStorage gracefully", () => {
      localStorage.removeItem("hunty_hunts")
      const hunts = getAllHuntsIncludingPrivate()
      expect(Array.isArray(hunts)).toBe(true)
    })
  })

  describe("edge cases", () => {
    it("handles empty hunt list", () => {
      localStorage.setItem("hunty_hunts", JSON.stringify([]))
      const hunts = getAllHuntsIncludingPrivate()
      expect(Array.isArray(hunts)).toBe(true)
    })

    it("handles hunt with missing optional fields", () => {
      const hunt: StoredHunt = {
        id: 970,
        title: "Minimal Hunt",
        description: "Test",
        cluesCount: 0,
        status: "Draft",
        rewardType: "XLM",
      }
      addHunt(hunt)
      const found = getHuntById(970)
      expect(found).toBeDefined()
      expect(found?.startTime).toBeUndefined()
      expect(found?.endTime).toBeUndefined()
    })

    it("handles clue with optional fields", () => {
      const hunt: StoredHunt = {
        id: 969,
        title: "Hunt",
        description: "Test",
        cluesCount: 0,
        status: "Draft",
        rewardType: "XLM",
      }
      addHunt(hunt)
      saveClueLocally({
        huntId: 969,
        question: "Q",
        answer: "A",
        points: 10,
      })
      const clues = getHuntClues(969)
      expect(clues[0]).toBeDefined()
      expect(clues[0].hint).toBeUndefined()
    })
  })
})
