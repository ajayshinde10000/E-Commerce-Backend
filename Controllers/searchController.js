import productsModel from "../Models/product.js";

class SearchController {
  static searchProduct = async (req, res) => {
    try {
      let { value } = req.query;
      if (value) {
        let products = await productsModel.find({
          $or: [
            { name: { $regex: value, $options: "i" } },
            { description: { $regex: value, $options: "i" } },
            { category: { $regex: value, $options: "i" } },
          ],
        }).select("-sellerId");
        res.send(products);
      } else {
        res.send([]);
      }
    } catch (err) {
      res.status(400).send({ message: "Error Occurred" });
    }
  };
}

export default SearchController;
